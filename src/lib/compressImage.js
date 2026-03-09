import imageCompression from 'browser-image-compression';

/**
 * Compresses an image File before uploading to Supabase Storage.
 * Uses browser-image-compression for high quality reductions and .webp conversion.
 * 
 * @param {File} file - The original image file
 * @param {object} options
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file) => {
    // 100% Original Quality - Bypass all compression and return exactly what was uploaded.
    // This maintains original format (.jpg/.png) and prevents WebP "progressive" part-by-part loading.
    return file;
};
