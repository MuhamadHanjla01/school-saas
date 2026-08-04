import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Global Axios defaults: timeout prevents the UI from hanging when backend is slow
axios.defaults.timeout = 10_000; // 10 seconds

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  // Configure global axios interceptor for requests to attach token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 503 = circuit breaker tripped on the server; don't retry, just propagate
        if (error.response?.status === 503) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/refresh') && !originalRequest.url.includes('/login')) {
          originalRequest._retry = true;
          try {
            // Attempt to refresh
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`, {}, {
              withCredentials: true
            });
            const { accessToken: newAccessToken } = res.data;
            setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            setUser(null);
            setAccessToken(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  // Initial check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`, {}, {
          withCredentials: true
        });
        setAccessToken(res.data.accessToken);
        const decoded = jwtDecode(res.data.accessToken);
        setUser({ 
          id: decoded.userId, 
          role: decoded.role, 
          schoolName: decoded.schoolName 
        });
      } catch (error) {
        // Not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`, { email, password, clientType: 'web' }, {
      withCredentials: true
    });
    setAccessToken(res.data.accessToken);
    setUser({
      ...res.data.user,
      schoolName: res.data.school?.name
    });
    return res.data.user;
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {}
    setUser(null);
    setAccessToken(null);
  };

  const forgotPassword = async (email) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/forgot-password`, { email });
    return res.data;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-primary-container">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword, loading, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};
