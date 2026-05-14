import imageCompression from 'browser-image-compression';

/**
 * Compresses an image File before uploading to Supabase Storage.
 * Uses browser-image-compression for high quality reductions.
 * 
 * @param {File} file - The original image file
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file) => {
    const options = {
        maxSizeMB: 2.5,             // Raised limit to 2.5MB as requested for max quality
        maxWidthOrHeight: 2048,     // Increased to 2048px for crystal clear quality on modern screens
        useWebWorker: true,
        fileType: 'image/webp',     // WebP gives superior quality at a fraction of the size
        initialQuality: 1           // Max quality setting
    };

    try {
        const compressedBlob = await imageCompression(file, options);
        
        // Ensure the returned File has the correct .webp extension
        const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const newFileName = `${originalNameWithoutExt}.webp`;
        const compressedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });
        
        console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB, Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original if compression fails
    }
};
