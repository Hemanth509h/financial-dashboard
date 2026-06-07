import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      let connected = false;
      while (mounted && !connected) {
        try {
          const res = await api.getMe();
          if (mounted) {
            setUser(res.data);
            document.documentElement.setAttribute('data-theme', res.data.theme || 'light');
            setLoading(false);
          }
          connected = true;
        } catch (err) {
          console.warn('Backend server not reachable or loading. Retrying...', err.message);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };
    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

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

  const logout = useCallback(() => {
    console.log('Logout requested, but authentication is disabled.');
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    document.documentElement.setAttribute('data-theme', updated.theme || 'light');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token: null, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
