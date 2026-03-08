import imageCompression from 'browser-image-compression';

/**
 * Compresses an image File before uploading to Supabase Storage.
 * Uses browser-image-compression for high quality reductions and .webp conversion.
 * 
 * @param {File} file - The original image file
 * @param {object} options
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (
    file,
    { maxSizeMB = 0.4, maxWidthOrHeight = 1600, useWebWorker = true } = {}
) => {
    // Skip compression for non-image files or very tiny files
    if (!file.type.startsWith('image/') || file.size < 50 * 1024) {
        return file;
    }

    try {
        const options = {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker,
            fileType: 'image/webp'
        };

        const compressedBlob = await imageCompression(file, options);

        // Return a File object
        const newName = file.name.replace(/\.[^.]+$/, '.webp');
        return new File([compressedBlob], newName, { type: 'image/webp' });
    } catch (error) {
        console.error('Error compressing image:', error);
        return file; // Fallback to original
    }
};
