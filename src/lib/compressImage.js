/**
 * Compresses an image File before uploading to Supabase Storage.
 * Uses Canvas API to resize and compress — replaces the old server-side `sharp` compression.
 * 
 * @param {File} file - The original image file
 * @param {object} options
 * @param {number} options.maxWidth - Max width in pixels (default 1600)
 * @param {number} options.maxHeight - Max height in pixels (default 1600)
 * @param {number} options.quality - JPEG quality 0-1 (default 0.80)
 * @param {string} options.outputType - MIME type (default 'image/webp')
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = (
    file,
    { maxWidth = 1600, maxHeight = 1600, quality = 0.80, outputType = 'image/webp' } = {}
) => {
    return new Promise((resolve, reject) => {
        // Skip compression for non-image files or tiny files (<50KB)
        if (!file.type.startsWith('image/') || file.size < 50 * 1024) {
            resolve(file);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            // Calculate new dimensions keeping aspect ratio
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            URL.revokeObjectURL(url);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file); // Fallback to original
                        return;
                    }
                    // Create a new File with the correct name but compressed content
                    const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
                    const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
                    const compressedFile = new File([blob], newName, { type: outputType });
                    resolve(compressedFile);
                },
                outputType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file); // Fallback to original on error
        };

        img.src = url;
    });
};
