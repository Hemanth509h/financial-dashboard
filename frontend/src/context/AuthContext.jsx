import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getMe()
      .then((res) => {
        if (mounted) {
          setUser(res.data);
          document.documentElement.setAttribute('data-theme', res.data.theme || 'light');
        }
      })
      .catch((err) => {
        console.warn('Failed to load user with current session:', err.message);
        if (mounted) {
          setUser(null);
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshSession = async () => {
      try {
        await api.refresh();
      } catch (err) {
        console.warn('Session refresh failed:', err.message);
        setUser(null);
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
      }
    };

    const handleFocus = () => {
      refreshSession();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(refreshSession, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    const { user: u } = res.data;
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await api.register(email, password, name);
    const { user: u } = res.data;
    setUser(u);
    document.documentElement.setAttribute('data-theme', u.theme || 'light');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Backend logout call failed:', err.message);
    }
    setUser(null);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemTheme);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    document.documentElement.setAttribute('data-theme', updated.theme || 'light');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
