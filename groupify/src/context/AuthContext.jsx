import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notifications, setNotifications] = useState({
    unreadChats: false,
    pendingInvites: false,
  });

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
        api.logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Background Notification Checker
  const checkNotifications = useCallback(async () => {
    if (!api.isAuthenticated()) return;
    try {
      // Backend calls (Make sure these exist in api.js or adjust accordingly)
      const invitesRes = await api.getPendingInvites?.().catch(() => []);
      const chatsRes = await api.getUnreadChatsStatus?.().catch(() => false);
      
      setNotifications({
        pendingInvites: invitesRes && invitesRes.length > 0,
        unreadChats: chatsRes === true || (Array.isArray(chatsRes) && chatsRes.length > 0),
      });
    } catch (error) {
      console.error("Silent background fetch failed", error);
    }
  }, []);

  // Polling every 30 seconds
  useEffect(() => {
    if (user) {
      checkNotifications();
      const intervalId = setInterval(checkNotifications, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user, checkNotifications]);

  const loginAction = useCallback(async (email, password) => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData);
    checkNotifications();
    return userData;
  }, [checkNotifications]);

  const signupAction = useCallback(async (email, password, name) => {
    return await api.signup(email, password, name);
  }, []);

  const verifyOtpAction = useCallback(async (email, otp) => {
    await api.verifyOtp(email, otp);
    const userData = await api.getMe();
    setUser(userData);
    checkNotifications();
    return userData;
  }, [checkNotifications]);

  const googleAuthAction = useCallback(async (credential) => {
    await api.googleAuth(credential);
    const userData = await api.getMe();
    setUser(userData);
    checkNotifications();
    return userData;
  }, [checkNotifications]);

  const logoutAction = useCallback(() => {
    api.logout();
    setUser(null);
    setNotifications({ unreadChats: false, pendingInvites: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await api.getMe();
    setUser(userData);
    checkNotifications();
    return userData;
  }, [checkNotifications]);

  const value = {
    user,
    loading,
    notifications,
    checkNotifications,
    login: loginAction,
    loginWithGoogle: googleAuthAction,
    signup: signupAction,
    verifyOtp: verifyOtpAction,
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