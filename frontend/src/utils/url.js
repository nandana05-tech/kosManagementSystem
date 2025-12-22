/**
 * URL utility functions for handling file paths in production
 */

/**
 * Get full URL for file paths (photos, uploads, etc.)
 * Handles both relative paths and absolute URLs
 * 
 * @param {string} path - The file path or URL
 * @returns {string|null} - Full URL or null if path is empty
 */
export const getFileUrl = (path) => {
  if (!path) return null;
  
  // Already absolute URL - return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Relative path - prepend base URL from API URL
  // VITE_API_URL is like "http://localhost:5000/api" or "/api"
  // We need base URL without "/api" suffix
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  let baseUrl = '';
  
  if (apiUrl.startsWith('http')) {
    // Absolute API URL - extract base (remove /api suffix)
    baseUrl = apiUrl.replace(/\/api$/, '');
  } else {
    // Relative API URL like "/api" - base is empty (same origin)
    baseUrl = '';
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Get default placeholder image for missing photos
 * 
 * @param {string} type - Type of placeholder ('kamar', 'user', etc.)
 * @returns {string} - Placeholder image URL
 */
export const getPlaceholderImage = (type = 'default') => {
  const placeholders = {
    kamar: '/placeholder-room.jpg',
    user: '/placeholder-avatar.jpg',
    default: '/placeholder.jpg'
  };
  return placeholders[type] || placeholders.default;
};
