import { useState, useEffect, useCallback } from 'react';
import { api, client } from '../api/index.js';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
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
