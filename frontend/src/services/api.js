import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Attach a human-readable flag for rate limiting
    if (error.response?.status === 429) {
      error.isRateLimit = true;
      error.rateLimitMessage = error.response?.data?.error || 'AI rate limit exceeded. Please wait before trying again.';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const ridesAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/rides?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/rides/${id}`),
  create: (data) => api.post('/rides', data),
  update: (id, data) => api.put(`/rides/${id}`, data),
  delete: (id) => api.delete(`/rides/${id}`),
};

export const showsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/shows?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/shows/${id}`),
  create: (data) => api.post('/shows', data),
  update: (id, data) => api.put(`/shows/${id}`, data),
  delete: (id) => api.delete(`/shows/${id}`),
};

export const restaurantsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/restaurants?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
};

export const attractionsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/attractions?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/attractions/${id}`),
  create: (data) => api.post('/attractions', data),
  update: (id, data) => api.put(`/attractions/${id}`, data),
  delete: (id) => api.delete(`/attractions/${id}`),
};

export const eventsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/events?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

export const giftShopsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/gift-shops?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/gift-shops/${id}`),
  create: (data) => api.post('/gift-shops', data),
  update: (id, data) => api.put(`/gift-shops/${id}`, data),
  delete: (id) => api.delete(`/gift-shops/${id}`),
};

export const facilitiesAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/facilities?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/facilities/${id}`),
  create: (data) => api.post('/facilities', data),
  update: (id, data) => api.put(`/facilities/${id}`, data),
  delete: (id) => api.delete(`/facilities/${id}`),
};

export const parkZonesAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/park-zones?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/park-zones/${id}`),
  create: (data) => api.post('/park-zones', data),
  update: (id, data) => api.put(`/park-zones/${id}`, data),
  delete: (id) => api.delete(`/park-zones/${id}`),
};

export const ticketsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/tickets?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
};

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  recommendRides: (data) => api.post('/ai/recommend-rides', data),
  planItinerary: (data) => api.post('/ai/plan-itinerary', data),
  recommendDining: (data) => api.post('/ai/recommend-dining', data),
  buildPlan: (data) => api.post('/ai/build-plan', data),
  getSession: (sessionId) => api.get(`/ai/session/${sessionId}`),
};

export const guestsAPI = {
  getPreferences: () => api.get('/guests/preferences'),
  savePreferences: (data) => api.post('/guests/preferences', data),
};

export default api;
