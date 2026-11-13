
import api from "./api";

export const authService = {
  async register(userData) {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  async refreshToken() {
    const storedRefreshToken = localStorage.getItem("connectly_refresh_token");
    const response = await api.post("/api/auth/refresh", {
      refreshToken: storedRefreshToken || undefined,
    });
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.patch("/api/auth/profile", profileData);
    return response.data;
  },

  async logout() {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },
};
