import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
    const TWO_MB = 2 * 1024 * 1024;

    // Skip compression entirely for images already under 2MB — preserve 100% original quality
    if (file.size <= TWO_MB) {
        return file;
    }

    const options = {
        maxSizeMB: 2.0,
        maxWidthOrHeight: 2560,
        useWebWorker: true,
        initialQuality: 0.90,
        // No fileType override — keep original format to avoid WebP canvas quality bugs
    };

    try {
        const compressedBlob = await imageCompression(file, options);
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });
        console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file;
    }
};
