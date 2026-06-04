/**
 * Groupify — Authentication Context.
 *
 * Provides user state, login/signup/logout actions, and loading states
 * to all components via React Context.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    async function loadUser() {
      if (!api.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        // Token is invalid/expired — clear it
        api.logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const loginAction = useCallback(async (email, password) => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  }, []);

  const signupAction = useCallback(async (email, password, name) => {
    await api.signup(email, password, name);
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  }, []);

  const logoutAction = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  }, []);

  const value = {
    user,
    loading,
    login: loginAction,
    signup: signupAction,
    logout: logoutAction,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
