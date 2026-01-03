// utils/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.1.6:3000";
// const BACKEND_URL = "https://backend-beatsphere.onrender.com";
// const BACKEND_URL = "https://beatsphere-backend.onrender.com";
const BACKEND_URL = "https://api.beatsphere.live";

const api = axios.create({
  baseURL: BACKEND_URL,
});

api.interceptors.request.use(async (config) => {
  const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
  
  if (sessionKey) {
    config.headers.Authorization = `Bearer ${sessionKey}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;