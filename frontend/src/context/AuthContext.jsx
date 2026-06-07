import { useState, useEffect, useCallback } from 'react';
import { api, client } from '../api/index.js';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('gf_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isRefreshing = false;

    // Interceptor to handle 401 and refresh token
    const interceptor = client.interceptors.response.use(
      response => {
        console.log('[API] Response:', response.config.method.toUpperCase(), response.config.url);
        return response;
      },
      error => {
        console.log('[API] Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
        
        const originalRequest = error.config;
        
        // Only attempt refresh for 401 on first attempt
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          if (!isRefreshing) {
            isRefreshing = true;
            return api.refresh()
              .then(res => {
                isRefreshing = false;
                console.log('[AUTH] Token refreshed, retrying original request');
                return client(originalRequest);
              })
              .catch(err => {
                isRefreshing = false;
                console.log('[AUTH] Refresh failed, clearing user');
                localStorage.removeItem('gf_user');
                if (mounted) setUser(null);
                return Promise.reject(err);
              });
          }
        }
        
        return Promise.reject(error);
      }
    );

    const initializeAuth = async () => {
      let connected = false;
      while (mounted && !connected) {
        try {
          const res = await api.getMe();
          if (mounted) {
            setUser(res.data);
            localStorage.setItem('gf_user', JSON.stringify(res.data));
            document.documentElement.setAttribute('data-theme', res.data.theme || 'light');
            setLoading(false);
          }
          connected = true;
        } catch (err) {
          console.log('[AUTH] Init failed:', err.message);
          
          // If it's an auth error after interceptor handling, mark as not authenticated
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('gf_user');
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
            connected = true;
          } else {
            // Connection issue, retry
            console.log('[AUTH] Retrying in 2s...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      mounted = false;
      client.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    const { user: u } = res.data;
    localStorage.setItem('gf_user', JSON.stringify(u));
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await api.register(email, password, name);
    const { user: u } = res.data;
    localStorage.setItem('gf_user', JSON.stringify(u));
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('gf_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('gf_user', JSON.stringify(updated));
    document.documentElement.setAttribute('data-theme', updated.theme || 'light');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token: null, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
