import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_TRIPOPS_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://travel-ai-platform-urhu.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

export default apiClient;
