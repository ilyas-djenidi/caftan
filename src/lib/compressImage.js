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
        maxSizeMB: 2,               // Max size 2MB
        maxWidthOrHeight: 1600,     // Max dimension 1600px
        useWebWorker: true,
        initialQuality: 0.8         // High quality
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log(`Original: ${file.size / 1024 / 1024} MB, Compressed: ${compressedFile.size / 1024 / 1024} MB`);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original if compression fails
    }
};
