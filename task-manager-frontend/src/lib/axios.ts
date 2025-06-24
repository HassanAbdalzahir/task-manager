import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3100/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `http://localhost:3100/api/auth/refresh-token`,
            { token: refreshToken }
          );

          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        }
      } catch {
        // Refresh token failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
