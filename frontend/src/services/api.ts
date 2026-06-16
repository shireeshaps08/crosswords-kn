import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const guestToken = localStorage.getItem('guest_token');
  if (guestToken) config.headers['x-guest-token'] = guestToken;
  return config;
});

export default api;
