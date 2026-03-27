import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nsjyyivbpyexqvywymaz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanl5aXZicHlleHF2eXd5bWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE2NzYsImV4cCI6MjA4ODIxNzY3Nn0.OplPHYNBci-LZAhmbaAp0lB0eHfBV2jl8M7sBkzcAOU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAllImages(path = '') {
    const { data: items, error } = await supabase.storage
        .from('caftan-images')
        .list(path, { limit: 100 });

    if (error) {
        console.error(`Error listing ${path || 'root'}:`, error);
        return;
    }

    for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id === null) { // It's a directory
            console.log(`\nFolder: ${fullPath}`);
            await listAllImages(fullPath);
        } else {
            console.log(`- ${fullPath} (${(item.metadata?.size / 1024).toFixed(2)} KB)`);
        }
    }
}

listAllImages();
