import axios from "axios";
import { auth } from "./firebase";

// Базова конфігурація API
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Інтерцептор для додавання токену до запитів
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Інтерцептор для обробки помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Перенаправлення на сторінку входу при помилці автентифікації
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// API методи для медикаментів
export const medicinesAPI = {
  getAll: (params) => api.get("/medicines", { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post("/medicines", data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  getCategories: () => api.get("/medicines/categories/list"),
  replaceScenic: () => api.post("/medicines/replace-scenic"),
  uploadInstruction: (id, file) => {
    const formData = new FormData();
    formData.append("instruction", file);
    return api.post(`/medicines/${id}/instruction`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteInstruction: (id) => api.delete(`/medicines/${id}/instruction`),
};

// API методи для замовлень
export const ordersAPI = {
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// API методи для користувачів
export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getAll: () => api.get("/users"),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

// API методи для автентифікації
export const authAPI = {
  verifyToken: (token) => api.post("/auth/verify-token", { token }),
  register: (data) => api.post("/auth/register", data),
};

// API методи для аптек
export const pharmaciesAPI = {
  getAll: () => api.get("/pharmacies"),
  getById: (id) => api.get(`/pharmacies/${id}`),
  create: (data) => api.post("/pharmacies", data),
  update: (id, data) => api.put(`/pharmacies/${id}`, data),
  delete: (id) => api.delete(`/pharmacies/${id}`),
};

export default api;
