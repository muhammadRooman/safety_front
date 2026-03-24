// src/config/api.js  (or wherever you define PublicApi)
const NGROK_URL = "https://a9df-116-71-23-44.ngrok-free.app";   // ← change only here

export const PublicApi = axios.create({
  baseURL: import.meta.env.DEV 
    ? NGROK_URL                    // use ngrok in development
    : import.meta.env.VITE_API_URL, // production URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add ngrok header only when using ngrok
PublicApi.interceptors.request.use((config) => {
  if (config.baseURL?.includes('ngrok')) {
    config.headers['ngrok-skip-browser-warning'] = '69420';
  }
  return config;
});