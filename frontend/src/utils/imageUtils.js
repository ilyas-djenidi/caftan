/**
 * Resolves a backend image path to a full URL or fallback.
 * @param {string} path - The relative path from the backend (e.g., /uploads/products/...)
 * @returns {string} - The full URL or placeholder
 */
export const getImageUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;

    // Use proxy in dev or full URL in prod if needed
    const baseUrl = import.meta.env.VITE_API_URL === '/api'
        ? ''
        : 'http://localhost:5000';

    return `${baseUrl}${path}`;
};
