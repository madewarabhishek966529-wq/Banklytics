import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const stored = localStorage.getItem('banklytics_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('banklytics_user');
        }
      }

      try {
        const data = await authService.getMe();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('banklytics_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // If unauthenticated or token expired, clear local state
        setUser(null);
        localStorage.removeItem('banklytics_user');
        localStorage.removeItem('banklytics_token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
