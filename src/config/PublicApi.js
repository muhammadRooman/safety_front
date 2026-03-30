// src/api/PublicApi.js
import axios from 'axios';

const PublicApi = axios.create({
  // Requests in app mostly pass full URL via ENV.appBaseUrl
  // so keep axios instance neutral (no hardcoded base URL).
});

PublicApi.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  const reqUrl = String(config.url || "");
  if (reqUrl.includes("ngrok")) {
    config.headers['ngrok-skip-browser-warning'] = '69420';
  }
  return config;
});

export default PublicApi;