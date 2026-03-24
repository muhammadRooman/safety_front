// src/api/PublicApi.js
import axios from 'axios';

const NGROK_URL = "https://a9df-116-71-23-44.ngrok-free.app";  // sirf yahan change karna

const PublicApi = axios.create({
  baseURL: NGROK_URL,
});

PublicApi.interceptors.request.use((config) => {
  config.headers['ngrok-skip-browser-warning'] = '69420';
  config.headers['Content-Type'] = 'application/json';
  return config;
});

export default PublicApi;