import { useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { authApiClient } from '../lib/authApi';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
  refreshUserProfile: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        if (authApiClient.isAuthenticated()) {
          const currentUser = authApiClient.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            
            // Optionally refresh user profile from server
            try {
              await authApiClient.ensureValidToken();
              const freshProfile = await authApiClient.getProfile();
              setUser(freshProfile);
              localStorage.setItem('user', JSON.stringify(freshProfile));
            } catch (profileError) {
              // If profile fetch fails, keep the cached user data
              console.warn('Failed to refresh profile:', profileError);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid authentication state
        authApiClient.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authApiClient.login(credentials);
      
      const newUser: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        createdAt: response.createdAt,
        dailyUsageCount: response.dailyUsageCount,
        lastUsageDate: response.lastUsageDate,
        isEmailVerified: response.isEmailVerified,
      };
      
      setUser(newUser);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authApiClient.register(userData);
      
      const newUser: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        createdAt: response.createdAt,
        dailyUsageCount: response.dailyUsageCount,
        lastUsageDate: response.lastUsageDate,
        isEmailVerified: response.isEmailVerified,
      };
      
      setUser(newUser);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApiClient.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!authApiClient.isAuthenticated()) return;
    
    try {
      await authApiClient.ensureValidToken();
      const freshProfile = await authApiClient.getProfile();
      setUser(freshProfile);
      localStorage.setItem('user', JSON.stringify(freshProfile));
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  const isAuthenticated = !!user && authApiClient.isAuthenticated();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUserProfile,
  };
};
