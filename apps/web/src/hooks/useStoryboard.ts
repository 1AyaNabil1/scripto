import { useState, useCallback } from 'react';
import type { StoryboardProject, GenerationRequest, AppState } from '../types';
import { apiClient } from '../lib/utils';

export const useStoryboard = () => {
  const [state, setState] = useState<AppState>({
    isGenerating: false,
    currentProject: null,
    projects: [],
    error: null,
    user: null,
    galleryStories: [],
    isLoadingGallery: false,
  });

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((isGenerating: boolean) => {
    setState(prev => ({ ...prev, isGenerating }));
  }, []);

  const generateStoryboard = useCallback(async (request: GenerationRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.generateStoryboard(request);
      
      if (response.success && response.frames) {
        // Convert backend frames to frontend format for display
        const frontendFrames = apiClient.convertToFrontendFrames(response.frames, request);
        
        const newProject: StoryboardProject = {
          id: `project-${Date.now()}`, // Generate a simple ID
          title: response.title || `Storyboard - ${new Date().toLocaleDateString()}`, // Use API title or fallback
          description: request.prompt.substring(0, 100) + '...',
          frames: frontendFrames,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          genre: request.genre,
          style: request.visualStyle,
          total_frames: response.frames.length,
        };

        setState(prev => ({
          ...prev,
          currentProject: newProject,
          projects: [newProject, ...prev.projects],
          isGenerating: false,
        }));

        return newProject;
      } else {
        throw new Error(response.error || 'Failed to generate storyboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError]);

  const loadProjects = useCallback(async () => {
    try {
      const projects = await apiClient.getProjects();
      setState(prev => ({ ...prev, projects }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      setError(errorMessage);
    }
  }, [setError]);

  const loadProject = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const project = await apiClient.getProject(projectId);
      setState(prev => ({ ...prev, currentProject: project, isGenerating: false }));
      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<StoryboardProject>) => {
    try {
      const updatedProject = await apiClient.updateProject(projectId, updates);
      setState(prev => ({
        ...prev,
        currentProject: prev.currentProject?.id === projectId ? updatedProject : prev.currentProject,
        projects: prev.projects.map(p => p.id === projectId ? updatedProject : p),
      }));
      return updatedProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await apiClient.deleteProject(projectId);
      setState(prev => ({
        ...prev,
        currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject,
        projects: prev.projects.filter(p => p.id !== projectId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const exportProject = useCallback(async (project: StoryboardProject, format: 'pdf' | 'json' = 'pdf') => {
    try {
      const blob = await apiClient.exportStoryboard(project, format);
      // Create filename from project title, sanitizing it for file system
      const sanitizedTitle = project.title
        .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with dashes
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .toLowerCase();
      const filename = `${sanitizedTitle || 'storyboard'}.${format}`;
      
      // Use the downloadFile utility from utils
      const { downloadFile } = await import('../lib/utils');
      downloadFile(blob, filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export project';
      setError(errorMessage);
      throw error;
    }
  }, [setError]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setCurrentProject = useCallback((project: StoryboardProject | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  }, []);

  return {
    ...state,
    generateStoryboard,
    loadProjects,
    loadProject,
    updateProject,
    deleteProject,
    exportProject,
    clearError,
    setCurrentProject,
  };
};
