import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
  refreshUserProfile: () => Promise<void>;
  
  // Legacy methods for backward compatibility
  getRemainingUsage: () => number;
  canUseService: () => boolean;
  updateUsage: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  // Legacy compatibility methods
  const getRemainingUsage = (): number => {
    if (!auth.user) return 0;
    const usageCount = auth.user.dailyUsageCount ?? 0;
    return Math.max(0, 3 - usageCount);
  };

  const canUseService = (): boolean => {
    if (!auth.user) return false;
    const usageCount = auth.user.dailyUsageCount ?? 0;
    return usageCount < 3;
  };

  const updateUsage = async (): Promise<boolean> => {
    if (!auth.user) return false;
    
    try {
      // For authenticated users, we'll need to update this through the auth API
      // For now, we'll use the legacy API method for backward compatibility
      const { apiClient } = await import('../lib/utils');
      
      const currentUsageCount = auth.user.dailyUsageCount ?? 0;
      const updatedUsage = {
        dailyUsageCount: currentUsageCount + 1,
        lastUsageDate: new Date().toISOString(),
      };

      await apiClient.updateUserUsage(auth.user.id, updatedUsage);
      
      // Refresh user profile to get updated usage
      await auth.refreshUserProfile();
      
      return true;
    } catch (error) {
      console.error('Error updating usage:', error);
      return false;
    }
  };

  const contextValue: AuthContextType = {
    ...auth,
    getRemainingUsage,
    canUseService,
    updateUsage,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
