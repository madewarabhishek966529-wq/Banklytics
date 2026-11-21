import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const stored = localStorage.getItem('banklytics_user');
      const token = localStorage.getItem('banklytics_token');
      if (stored && token) {
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
          setLoading(false);
          return;
        }
      } catch (err) {
        // Token was invalid or not present
      }

      // Local-first auto-onboarding: If not logged in and not explicitly logged out,
      // seamlessly initialize a local demo session
      const isLoggedOut = localStorage.getItem('banklytics_logged_out') === 'true';
      if (!isLoggedOut) {
        try {
          const demoData = await authService.loginDemo();
          if (demoData && demoData.user) {
            setUser(demoData.user);
          }
        } catch (demoErr) {
          console.warn('Local session initialization notice:', demoErr.message);
        }
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    localStorage.removeItem('banklytics_logged_out');
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    localStorage.removeItem('banklytics_logged_out');
    const data = await authService.register(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    localStorage.setItem('banklytics_logged_out', 'true');
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
