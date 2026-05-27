import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gf_token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('gf_token')));

  useEffect(() => {
    if (!token) return;

    api.getMe()
      .then((res) => {
        setUser(res.data);
        document.documentElement.setAttribute('data-theme', res.data.theme || 'light');
      })
      .catch(() => {
        localStorage.removeItem('gf_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
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

  const logout = useCallback(() => {
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
