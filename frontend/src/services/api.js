import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

// Request interceptor: attach Authorization and refresh token headers if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("connectly_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const refreshToken = localStorage.getItem("connectly_refresh_token");
    if (refreshToken && !config.headers["x-refresh-token"]) {
      config.headers["x-refresh-token"] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // If server transparently rotated tokens, update local storage
    const newAccessToken =
      response.headers?.["x-access-token"] ||
      response.data?.accessToken ||
      response.data?.token;
    if (newAccessToken && typeof newAccessToken === "string") {
      localStorage.setItem("connectly_token", newAccessToken);
    }
    const newRefreshToken = response.data?.refreshToken;
    if (newRefreshToken && typeof newRefreshToken === "string") {
      localStorage.setItem("connectly_refresh_token", newRefreshToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthRoute = /\/api\/auth\/(login|register|refresh)$/.test(
      originalRequest.url || ""
    );

    // If 401 and not already refreshing an auth route
    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem("connectly_refresh_token");

        const refreshRes = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken || undefined },
          {
            withCredentials: true,
            headers: {
              ...(storedRefreshToken
                ? { "x-refresh-token": storedRefreshToken }
                : {}),
            },
          }
        );

        const newAccessToken =
          refreshRes.data?.accessToken || refreshRes.data?.token;
        const newRefreshToken = refreshRes.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem("connectly_token", newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        if (newRefreshToken) {
          localStorage.setItem("connectly_refresh_token", newRefreshToken);
        }

        if (refreshRes.data?.user) {
          localStorage.setItem(
            "connectly_user",
            JSON.stringify(refreshRes.data.user)
          );
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("connectly_token");
        localStorage.removeItem("connectly_refresh_token");
        localStorage.removeItem("connectly_user");
        window.dispatchEvent(new Event("connectly:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Direct 401 on refresh endpoint means session completely expired
    if (
      error.response?.status === 401 &&
      originalRequest.url?.includes("/api/auth/refresh")
    ) {
      localStorage.removeItem("connectly_token");
      localStorage.removeItem("connectly_refresh_token");
      localStorage.removeItem("connectly_user");
      window.dispatchEvent(new Event("connectly:unauthorized"));
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : error.message || "An unexpected error occurred.");

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default api;
