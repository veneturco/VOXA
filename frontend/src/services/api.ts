import axios from 'axios';

// Storage key for admin secret session
const ADMIN_KEY_STORAGE = 'voxa_admin_key';

// Check if an admin key is stored in browser memory or URL param
export const getAdminKey = (): string => {
  try {
    // 1. Check URL query param ?key=... or ?admin_key=... for instant bookmark access
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('admin_key') || params.get('key');
    if (queryKey) {
      localStorage.setItem(ADMIN_KEY_STORAGE, queryKey.trim());
      // Clean query params from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      return queryKey.trim();
    }

    // 2. Read from localStorage
    const stored = localStorage.getItem(ADMIN_KEY_STORAGE);
    return stored ? stored.trim() : '';
  } catch {
    return '';
  }
};

export const setAdminKey = (key: string): void => {
  try {
    if (key && key.trim()) {
      localStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  } catch (err) {
    console.error('Error saving admin key:', err);
  }
};

export const clearAdminKey = (): void => {
  try {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch {}
};

// Global Axios Interceptor: automatically attaches the X-Admin-Key header
axios.interceptors.request.use((config) => {
  const key = getAdminKey();
  if (key) {
    config.headers['X-Admin-Key'] = key;
  }
  return config;
});

export default axios;
