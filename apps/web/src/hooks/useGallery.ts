import { useState, useCallback, useEffect } from 'react';
import type { GalleryStory, StoryboardProject } from '../types';
import { apiClient } from '../lib/utils';

export const useGallery = () => {
  const [galleryStories, setGalleryStories] = useState<GalleryStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load gallery stories
  const loadGalleryStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stories = await apiClient.getGalleryStories();
      setGalleryStories(stories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load gallery';
      setError(errorMessage);
      console.error('Error loading gallery:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add story to gallery
  const addToGallery = useCallback(async (
    project: StoryboardProject, 
    userId: string, 
    userName: string
  ): Promise<boolean> => {
    try {
      const galleryStory: Omit<GalleryStory, 'id' | 'likes'> = {
        title: project.title,
        description: project.description,
        frames: project.frames,
        createdAt: new Date().toISOString(),
        userName,
        userId,
        genre: project.genre,
        style: project.style,
        totalFrames: project.total_frames,
        isPublic: true,
      };

      const newGalleryStory = await apiClient.addStoryToGallery(galleryStory);
      setGalleryStories(prev => [newGalleryStory, ...prev]);
      
      return true;
    } catch (error) {
      console.error('Error adding to gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to add to gallery');
      return false;
    }
  }, []);

  // Like a story with optimistic updates
  const likeStory = useCallback(async (storyId: string, userId: string): Promise<boolean> => {
    try {
      await apiClient.likeGalleryStory(storyId, userId);
      
      // Only update UI after successful API call
      setGalleryStories(prev => 
        prev.map(story => {
          if (story.id === storyId) {
            const currentLikes = story.likes || 0;
            return { ...story, likes: currentLikes + 1 };
          }
          return story;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error liking story:', error);
      
      // Check if it's a foreign key constraint error (user doesn't exist)
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        throw new Error('User account not found. Please refresh the page and try again.');
      }
      
      throw error;
    }
  }, []);

  
  // Get stories by user
  const getUserStories = useCallback((userId: string): GalleryStory[] => {
    return galleryStories.filter(story => story.userId === userId);
  }, [galleryStories]);

  // Remove a story from the gallery (for admin delete)
  const removeStory = useCallback((storyId: string): void => {
    setGalleryStories(prev => prev.filter(story => story.id !== storyId));
  }, []);

  // Search stories
  const searchStories = useCallback((query: string): GalleryStory[] => {
    const lowercaseQuery = query.toLowerCase();
    return galleryStories.filter(story => 
      story.title.toLowerCase().includes(lowercaseQuery) ||
      story.description.toLowerCase().includes(lowercaseQuery) ||
      story.userName.toLowerCase().includes(lowercaseQuery) ||
      story.genre?.toLowerCase().includes(lowercaseQuery)
    );
  }, [galleryStories]);

  // Auto-load gallery on mount
  useEffect(() => {
    loadGalleryStories();
  }, [loadGalleryStories]);

  return {
    galleryStories,
    isLoading,
    error,
    loadGalleryStories,
    addToGallery,
    likeStory,
    getUserStories,
    searchStories,
    removeStory,
  };
};
