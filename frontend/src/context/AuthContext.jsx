import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
          // Also save to localStorage for persistence
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('bookle_user', JSON.stringify(response.user));
          }
        }
      } catch (error) {
        // Not logged in or session expired
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('bookle_user');
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        if (rememberMe && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('bookle_user', JSON.stringify(response.user));
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('bookle_user', JSON.stringify(response.user));
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Đăng ký thất bại';
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          localStorage.removeItem('bookle_user');
        }
        if (window.sessionStorage) {
          sessionStorage.removeItem('bookle_user');
        }
      }
    }
  };

  const updateProfile = async (payload) => {
    try {
      const response = await authAPI.updateProfile(payload);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('bookle_user', JSON.stringify(response.user));
        }
        return response;
      }

      throw new Error(response.error || 'Cập nhật thông tin thất bại');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Cập nhật thông tin thất bại';
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} size="large" variant="spinner" text="Đang tải..." />
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

