// Base API URL configuration
// Normalizes VITE_API_URL by trimming whitespace, removing quotes, and stripping trailing slashes.
const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || 'https://wardn-backend-tt0s.onrender.com';
  if (!rawUrl) return 'https://wardn-backend-tt0s.onrender.com';
  
  const trimmed = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return 'https://wardn-backend-tt0s.onrender.com';


  // Strip trailing slashes to prevent double slashes when joining endpoint paths
  return trimmed.replace(/\/+$/, '');
};

export const API_BASE = getApiBaseUrl();

/**
 * Constructs a full image URL given a relative or absolute image path.
 * Uses API_BASE for relative paths starting with / (e.g. /uploads/abc.jpg).
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE}${cleanPath}`;
};
