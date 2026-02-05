import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  AuthTokens, 
  User,
  PasswordResetRequest,
  PasswordResetConfirm 
} from '../types';

// Use local URL for development
const API_BASE_URL = 'http://localhost:7071/api';

class AuthApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if access token exists
    const accessToken = this.getAccessToken();
    if (accessToken) {
      const authHeaders = config.headers as Record<string, string>;
      if (!authHeaders['Authorization']) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${accessToken}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        // Check for both 'error' and 'message' fields in the API response
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_expires_at', 
      (Date.now() + tokens.expires_in * 1000).toString()
    );
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user');
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    return Date.now() > parseInt(expiresAt);
  }

  // Authentication methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Store tokens and user data
    this.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      token_type: response.token_type,
      expires_in: response.expires_in,
    });
    
    const user: User = {
      id: response.id,
      name: response.name,
      email: response.email,
      createdAt: response.createdAt,
      dailyUsageCount: response.dailyUsageCount,
      lastUsageDate: response.lastUsageDate,
      isEmailVerified: response.isEmailVerified,
      isAdmin: response.isAdmin,
      role: response.role,
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Store tokens and user data
    this.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      token_type: response.token_type,
      expires_in: response.expires_in,
    });
    
    const user: User = {
      id: response.id,
      name: response.name,
      email: response.email,
      createdAt: response.createdAt,
      dailyUsageCount: response.dailyUsageCount,
      lastUsageDate: response.lastUsageDate,
      isEmailVerified: response.isEmailVerified,
      isAdmin: response.isAdmin,
      role: response.role,
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    this.setTokens(response);
    return response;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response));
    return response;
  }

  async logout(): Promise<void> {
    // Clear all stored data
    this.clearTokens();
    
    // Note: In a more secure implementation, you might want to 
    // call a logout endpoint to invalidate the refresh token on the server
  }

  async forgotPassword(data: PasswordResetRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: PasswordResetConfirm): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!accessToken && !!user && !this.isTokenExpired();
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Auto-refresh token when it's about to expire
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        // Refresh failed, user needs to login again
        this.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }
  }
}

export const authApiClient = new AuthApiClient();
