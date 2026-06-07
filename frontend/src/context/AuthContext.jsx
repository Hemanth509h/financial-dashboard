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
    let failedQueue = [];

    const processQueue = (error, token = null) => {
      failedQueue.forEach(prom => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    // Interceptor to handle 401 and refresh token
    const interceptor = client.interceptors.response.use(
      response => response,
      error => {
        const originalRequest = error.config;
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            if (!isRefreshing) {
              isRefreshing = true;
              return api.refresh()
                .then(res => {
                  isRefreshing = false;
                  processQueue(null, res.data.token);
                  return client(originalRequest);
                })
                .catch(err => {
                  isRefreshing = false;
                  processQueue(err, null);
                  localStorage.removeItem('gf_user');
                  if (mounted) {
                    setUser(null);
                  }
                  return Promise.reject(err);
                });
            } else if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then(token => client(originalRequest))
                .catch(err => Promise.reject(err));
            }
          }
          localStorage.removeItem('gf_user');
          if (mounted) {
            setUser(null);
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
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // Try refresh
            try {
              await api.refresh();
              try {
                const meRes = await api.getMe();
                if (mounted) {
                  setUser(meRes.data);
                  localStorage.setItem('gf_user', JSON.stringify(meRes.data));
                  document.documentElement.setAttribute('data-theme', meRes.data.theme || 'light');
                  setLoading(false);
                }
                connected = true;
              } catch (meErr) {
                localStorage.removeItem('gf_user');
                if (mounted) {
                  setUser(null);
                  setLoading(false);
                }
                connected = true;
              }
            } catch (refreshErr) {
              localStorage.removeItem('gf_user');
              if (mounted) {
                setUser(null);
                setLoading(false);
              }
              connected = true;
            }
          } else {
            console.warn('Backend server not reachable or loading. Retrying...', err.message);
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
