import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Active local network IP for the host machine running backend on port 5000
export const MACHINE_LAN_IP = '10.41.162.1';
export const DEFAULT_PORT = 5000;

export const STORAGE_KEY_API_URL = '@tms_api_base_url';

/**
 * Returns sensible default API base URL depending on runtime environment
 */
export const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    return `http://${MACHINE_LAN_IP}:${DEFAULT_PORT}/api`;
  }
  if (Platform.OS === 'ios') {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }
  return `http://localhost:${DEFAULT_PORT}/api`;
};

// Quick presets for convenience
export const PRESET_URLS = [
  { label: 'Current Hotspot/Wi-Fi (10.41.162.1)', url: `http://10.41.162.1:5000/api` },
  { label: 'Previous IP (10.163.165.1)', url: `http://10.163.165.1:5000/api` },
  { label: 'Previous Wi-Fi (192.168.1.4)', url: `http://192.168.1.4:5000/api` },
  { label: 'Old Hotspot IP (192.168.209.13)', url: `http://192.168.209.13:5000/api` },
  { label: 'Android Emulator (10.0.2.2)', url: `http://10.0.2.2:5000/api` },
  { label: 'iOS Simulator / Localhost', url: `http://localhost:5000/api` },
];

const normalizeApiUrl = (url) => {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
};

let cachedBaseUrl = null;

export const getBaseUrl = async () => {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.trim()) {
      // If user had an old non-working IP saved, migrate to current active IP
      let target = saved;
      if (
        target.includes('192.168.209.13') ||
        target.includes('10.163.165.1') ||
        target.includes('192.168.1.4')
      ) {
        target = target
          .replace('192.168.209.13', MACHINE_LAN_IP)
          .replace('10.163.165.1', MACHINE_LAN_IP)
          .replace('192.168.1.4', MACHINE_LAN_IP);
      }
      const normalized = normalizeApiUrl(target);
      await AsyncStorage.setItem(STORAGE_KEY_API_URL, normalized);
      cachedBaseUrl = normalized;
      return cachedBaseUrl;
    }
  } catch (err) {
    console.warn('Error reading saved API URL:', err);
  }
  cachedBaseUrl = normalizeApiUrl(getDefaultBaseUrl());
  return cachedBaseUrl;
};

export const setCustomBaseUrl = async (url) => {
  if (!url) return;
  const cleanUrl = normalizeApiUrl(url);
  cachedBaseUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
};

export const resetBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
  cachedBaseUrl = getDefaultBaseUrl();
  return cachedBaseUrl;
};

/**
 * Helper to construct full media URL for static uploads
 */
export const resolveFileUrl = (relativePath, apiBaseUrl) => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanBase = (apiBaseUrl || cachedBaseUrl || getDefaultBaseUrl()).replace(/\/api\/?$/, '');
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${cleanBase}${cleanPath}`;
};
