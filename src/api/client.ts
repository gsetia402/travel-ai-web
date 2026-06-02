import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_TRIPOPS_API_URL || import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  console.error('[apiClient] VITE_TRIPOPS_API_URL is not set. API requests will fail.');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

export default apiClient;
