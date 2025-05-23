import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storagePath, setStoragePath] = useState(localStorage.getItem('storagePath') || '');

  // Initialize auth: restore token and fetch user
  useEffect(() => {
    async function initialize() {
      const savedPath = localStorage.getItem('storagePath');
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      console.log('Initializing auth with saved data:', { savedPath, savedUser, savedToken }); // Debug log
      
      if (savedPath) setStoragePath(savedPath);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (!savedToken) {
        // If no token, clear user data
        console.log('No token found, clearing user data'); // Debug log
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    }
    initialize();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting login with credentials:', {
        doctorId: credentials.doctorId,
        password: '***' // Don't log the actual password
      });
      
      const response = await authAPI.login(credentials);
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      console.log('Login successful, user and token stored');
      return user;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('storagePath');
      setUser(null);
      setStoragePath('');
    }
  };

  const updateStoragePath = useCallback((newPath) => {
    localStorage.setItem('storagePath', newPath);
    setStoragePath(newPath);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, storagePath, updateStoragePath }),
    [user, loading, error, storagePath, login, updateStoragePath]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
