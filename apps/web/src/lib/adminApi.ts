/**
 * Admin API client for management endpoints
 * All endpoints require admin authentication
 */

import { authApiClient } from './authApi';

// In development, use the proxy. In production, use the full URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/management' // Use proxy in development
  : 'https://Scripto.azurewebsites.net/api/management';

// Admin types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  dailyUsageCount: number;
  lastUsageDate: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
  role: 'user' | 'admin' | 'superadmin';
}

export interface AdminStory {
  id: string;
  title: string;
  description: string;
  frames: any[];
  createdAt: string;
  userName: string;
  userId: string;
  genre?: string;
  style?: string;
  totalFrames: number;
  likes: number;
  isPublic: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalStories: number;
  publicStories: number;
  privateStories: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure user is authenticated and is admin
    if (!authApiClient.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const user = authApiClient.getCurrentUser();
    if (!user?.isAdmin) {
      throw new Error('Admin access required');
    }

    await authApiClient.ensureValidToken();
    const accessToken = authApiClient.getAccessToken();

    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(limit = 50, offset = 0): Promise<PaginatedResponse<AdminUser>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await this.request<{
      users: any[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }>(`/users?${params}`);
    
    return {
      data: response.users.map(this.normalizeUser),
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      hasMore: response.hasMore,
    };
  }

  async getUserDetails(userId: string): Promise<{ user: AdminUser; stories: AdminStory[]; totalStories: number }> {
    const response = await this.request<{
      user: any;
      stories: any[];
      totalStories: number;
    }>(`/users/${userId}`);
    
    return {
      user: this.normalizeUser(response.user),
      stories: response.stories.map(this.normalizeStory),
      totalStories: response.totalStories,
    };
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async updateUserRole(userId: string, isAdmin: boolean, role: 'user' | 'admin' | 'superadmin'): Promise<{ success: boolean; user: AdminUser }> {
    const response = await this.request<{ success: boolean; user: any }>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin, role }),
    });
    
    return {
      success: response.success,
      user: this.normalizeUser(response.user),
    };
  }

  // ==================== STORY MANAGEMENT ====================

  async getAllStories(limit = 50, offset = 0, includePrivate = true): Promise<PaginatedResponse<AdminStory>> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      includePrivate: String(includePrivate),
    });
    const response = await this.request<{
      stories: any[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }>(`/stories?${params}`);
    
    return {
      data: response.stories.map(this.normalizeStory),
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      hasMore: response.hasMore,
    };
  }

  async deleteStory(storyId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/stories/${storyId}`, { method: 'DELETE' });
  }

  async updateStoryVisibility(storyId: string, isPublic: boolean): Promise<{ success: boolean; message: string; story: AdminStory }> {
    const response = await this.request<{ success: boolean; message: string; story: any }>(`/stories/${storyId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
    
    return {
      success: response.success,
      message: response.message,
      story: this.normalizeStory(response.story),
    };
  }

  async addStoryToGallery(storyData: {
    title: string;
    description: string;
    frames: any[];
    userName: string;
    userId: string;
    genre?: string;
    style?: string;
    isPublic?: boolean;
  }): Promise<{ success: boolean; message: string; story: AdminStory }> {
    const response = await this.request<{ success: boolean; message: string; story: any }>('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
    
    return {
      success: response.success,
      message: response.message,
      story: this.normalizeStory(response.story),
    };
  }

  // ==================== STATISTICS ====================

  async getStats(): Promise<AdminStats> {
    return this.request('/stats');
  }

  // ==================== HELPER METHODS ====================

  private normalizeUser(user: any): AdminUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt || user.created_at,
      dailyUsageCount: user.dailyUsageCount || user.daily_usage_count || 0,
      lastUsageDate: user.lastUsageDate || user.last_usage_date || '',
      isEmailVerified: user.isEmailVerified || user.is_email_verified || false,
      isAdmin: user.isAdmin || user.is_admin || false,
      role: user.role || 'user',
    };
  }

  private normalizeStory(story: any): AdminStory {
    let frames = story.frames;
    if (typeof frames === 'string') {
      try {
        frames = JSON.parse(frames);
      } catch {
        frames = [];
      }
    }
    
    return {
      id: story.id,
      title: story.title,
      description: story.description,
      frames: frames || [],
      createdAt: story.createdAt || story.created_at,
      userName: story.userName || story.user_name,
      userId: story.userId || story.user_id,
      genre: story.genre,
      style: story.style,
      totalFrames: story.totalFrames || story.total_frames || (Array.isArray(frames) ? frames.length : 0),
      likes: story.likes || 0,
      isPublic: story.isPublic ?? story.is_public ?? true,
    };
  }
}

export const adminApiClient = new AdminApiClient();
