import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("userInfo");
  if (!raw) {
    return config;
  }
  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore corrupt localStorage so public routes still work */
  }
  return config;
});

export default api;
