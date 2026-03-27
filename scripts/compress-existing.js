import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Config
const SUPABASE_URL = "https://nsjyyivbpyexqvywymaz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanl5aXZicHlleHF2eXd5bWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE2NzYsImV4cCI6MjA4ODIxNzY3Nn0.OplPHYNBci-LZAhmbaAp0lB0eHfBV2jl8M7sBkzcAOU";
const BUCKET = 'caftan-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compressAndUpload(filePath) {
    console.log(`Processing: ${filePath}...`);
    
    try {
        // 1. Download
        const { data: blob, error: downloadError } = await supabase.storage
            .from(BUCKET)
            .download(filePath);

        if (downloadError) throw downloadError;

        const buffer = Buffer.from(await blob.arrayBuffer());
        const originalSize = buffer.length;

        // 2. Compress with Sharp
        // Resize to max 1600px, preserve aspect ratio
        // Output at 90% quality since 2MB is the new target limit
        const compressedBuffer = await sharp(buffer)
            .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90, progressive: true })
            .toBuffer();

        const compressedSize = compressedBuffer.length;

        // Only upload if it's smaller AND under 2MB (or much smaller than original)
        if (compressedSize >= originalSize && originalSize <= 2 * 1024 * 1024) {
            console.log(`- Skipping ${filePath} (already optimized and under 2MB)`);
            return;
        }

        // 3. Upload back (Overwrite by delete then insert to avoid RLS upsert issues)
        console.log(`- Uploading compressed version (${(compressedSize/1024).toFixed(1)}KB)...`);
        
        // Delete first
        const { error: removeError } = await supabase.storage
            .from(BUCKET)
            .remove([filePath]);
        
        if (removeError) {
            console.warn(`- Pre-delete warning for ${filePath}:`, removeError.message);
        }

        // Wait a bit for Supabase to catch up
        await new Promise(r => setTimeout(r, 500));

        // Upload
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, compressedBuffer, {
                contentType: 'image/jpeg',
                upsert: false // We already deleted
            });

        if (uploadError) throw uploadError;

        const savedBytes = originalSize - compressedSize;
        const reduction = (savedBytes / originalSize * 100).toFixed(1);
        console.log(`- Success! Reduced ${reduction}% saved.`);

        return { saved: savedBytes };

    } catch (err) {
        console.error(`- Error processing ${filePath}:`, err.message);
        return null;
    }
}

let totalSavings = 0;
let processedCount = 0;

async function processFolder(path = '') {
    const { data: items } = await supabase.storage.from(BUCKET).list(path, { limit: 100 });
    
    if (!items) return;

    for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id === null) { // Directory
            await processFolder(fullPath);
        } else if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
            const result = await compressAndUpload(fullPath);
            if (result) {
                totalSavings += result.saved;
                processedCount++;
            }
        }
    }
}

async function run() {
    console.log('Starting recursive batch image compression...');
    const startTime = Date.now();
    
    await processFolder('');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n--- Compression Summary ---');
    console.log(`Images processed: ${processedCount}`);
    console.log(`Total data saved: ${(totalSavings / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Duration: ${duration}s`);
    console.log('---------------------------\n');
}

run();
