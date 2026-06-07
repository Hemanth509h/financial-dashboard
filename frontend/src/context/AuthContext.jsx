import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api/index.js';

// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemTheme);
      setLoading(false);
      return;
    }

    let mounted = true;
    api.getMe()
      .then((res) => {
        if (mounted) {
          setUser(res.data);
          document.documentElement.setAttribute('data-theme', res.data.theme || 'light');
        }
      })
      .catch((err) => {
        console.warn('Failed to load user with current token:', err.message);
        if (mounted) {
          localStorage.removeItem('gf_token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('gf_token', t);
    setToken(t);
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await api.register(email, password, name);
    const { token: t, user: u } = res.data;
    localStorage.setItem('gf_token', t);
    setToken(t);
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Backend logout call failed:', err.message);
    }
    localStorage.removeItem('gf_token');
    setToken(null);
    setUser(null);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemTheme);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    document.documentElement.setAttribute('data-theme', updated.theme || 'light');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for using AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
