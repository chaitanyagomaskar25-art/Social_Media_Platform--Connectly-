import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('connectly_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('connectly_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync state helper
  const handleAuthSuccess = (authData) => {
    // Normalizing different backend payload structures:
    // e.g. { token, user }, { data: { token, user } }, { accessToken, user }
    const receivedToken =
      authData.token ||
      authData.accessToken ||
      authData.data?.token ||
      authData.data?.accessToken;

    const receivedUser =
      authData.user ||
      authData.data?.user ||
      authData.data ||
      authData;

    if (receivedToken) {
      localStorage.setItem('connectly_token', receivedToken);
      setToken(receivedToken);
    }

    const receivedRefreshToken =
      authData.refreshToken ||
      authData.data?.refreshToken;

    if (receivedRefreshToken) {
      localStorage.setItem('connectly_refresh_token', receivedRefreshToken);
    }

    if (receivedUser) {
      localStorage.setItem('connectly_user', JSON.stringify(receivedUser));
      setUser(receivedUser);
    }

    return receivedUser;
  };

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authService.getCurrentUser();
        const currentUser = res.user || res.data?.user || res.data || res;
        setUser(currentUser);
        localStorage.setItem('connectly_user', JSON.stringify(currentUser));
      } catch (err) {
        if (err.status === 401) {
          try {
            const refreshRes = await authService.refreshToken();
            const currentUser =
              refreshRes.user || refreshRes.data?.user || refreshRes.data;
            if (currentUser) {
              setUser(currentUser);
              localStorage.setItem('connectly_user', JSON.stringify(currentUser));
              return;
            }
          } catch {
            // Refresh failed or expired
          }
          setUser(null);
          setToken(null);
          localStorage.removeItem('connectly_user');
          localStorage.removeItem('connectly_token');
          localStorage.removeItem('connectly_refresh_token');
        } else {
          console.warn('Initial session validation failed:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('connectly_user');
      localStorage.removeItem('connectly_token');
      localStorage.removeItem('connectly_refresh_token');
    };

    window.addEventListener('connectly:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('connectly:unauthorized', handleUnauthorized);
    };
  }, []);

  // Background silent refresh every 10 minutes to maintain persistent active session
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch {
        // Handled by response interceptor
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    return handleAuthSuccess(data);
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    return handleAuthSuccess(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('connectly_user');
      localStorage.removeItem('connectly_token');
      localStorage.removeItem('connectly_refresh_token');
    }
  };

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('connectly_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user || token),
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
