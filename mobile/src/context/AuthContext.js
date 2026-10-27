import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, TOKEN_STORAGE_KEY } from '../services/api';

const USER_STORAGE_KEY = '@tms_auth_user';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
    } catch (error) {
      console.warn('Failed to fetch profile:', error?.response?.data?.message || error.message);
      // If unauthorized, clear saved token
      if (error?.response?.status === 401) {
        await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {}
        }

        if (savedToken) {
          setToken(savedToken);
          await fetchProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error restoring auth state:', err);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data;

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);

    // Fetch full profile (contains department/programme population)
    try {
      const profileRes = await authService.getProfile();
      if (profileRes.data) {
        setUser(profileRes.data);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profileRes.data));
      }
    } catch (e) {
      // Ignore background profile fetch errors, base user is already set
    }

    return response.data;
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
    } catch (err) {
      console.warn('Error during logout:', err);
    }
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
