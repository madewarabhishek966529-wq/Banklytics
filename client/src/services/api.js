import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token from localStorage if cookie is blocked in certain cross-origin environments
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('banklytics_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized redirects cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('banklytics_token');
        localStorage.removeItem('banklytics_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
