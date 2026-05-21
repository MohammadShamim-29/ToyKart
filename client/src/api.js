import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true
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

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute = String(original?.url || "").includes("/auth/");
    if (status !== 401 || original?._retry || isAuthRoute) {
      return Promise.reject(error);
    }
    original._retry = true;
    if (!refreshPromise) {
      refreshPromise = api
        .post("/auth/refresh")
        .then(({ data }) => {
          const raw = localStorage.getItem("userInfo");
          const prev = raw ? JSON.parse(raw) : {};
          localStorage.setItem("userInfo", JSON.stringify({ ...prev, ...data }));
          return data.token;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    try {
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      localStorage.removeItem("userInfo");
      return Promise.reject(error);
    }
  }
);

export default api;
