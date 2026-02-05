import type { GenerationRequest, GenerationResponse, StoryboardProject, ApiError, BackendStoryboardFrame, StoryboardFrame } from '../types';

// In development, use the proxy. In production, use the full URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' // Use proxy in development with /api prefix
  : 'https://Scripto.azurewebsites.net/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // Add CORS headers to the request
        'Accept': 'application/json',
        ...options.headers,
      },
      // Add CORS mode
      mode: 'cors',
      credentials: 'omit',
      ...options,
    };

    // Try to add authentication header if available
    try {
      const { authApiClient } = await import('./authApi');
      if (authApiClient.isAuthenticated()) {
        await authApiClient.ensureValidToken();
        const accessToken = authApiClient.getAccessToken();
        if (accessToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${accessToken}`,
          };
        }
      }
    } catch (authError) {
      // If auth is not available or fails, continue without auth
      console.debug('Auth not available or failed:', authError);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          
          // Try to parse as JSON first
          try {
            const errorData: ApiError = JSON.parse(errorText);
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          } catch (parseError) {
            // If not JSON, use the raw text
            throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
          }
        } catch (textError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const responseText = await response.text();
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }
      
    } catch (error) {
      
      // Check for specific CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('CORS Error: The server did not allow this request from your domain. This is likely a CORS (Cross-Origin Resource Sharing) configuration issue on the server.');
      }
      
      // Check for network connectivity
      if (error instanceof TypeError && (error.message.includes('NetworkError') || error.message.includes('fetch'))) {
        throw new Error('Network error: Could not connect to the server. This might be a CORS issue or the server might be down.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Convert backend frames to frontend format
  private convertBackendFramesToFrontend(backendFrames: BackendStoryboardFrame[], request: GenerationRequest): StoryboardFrame[] {
    return backendFrames.map((frame, index) => ({
      panel_number: index + 1,
      scene_description: frame.description,
      visual_elements: this.extractVisualElements(frame.description),
      camera_angle: request.cameraAngles?.[index % (request.cameraAngles?.length || 1)] || 'Medium Shot',
      mood: request.mood || 'Neutral',
      dialogue: frame.dialogue || undefined,
      action_notes: frame.actionNote || undefined,
      timestamp: new Date().toISOString(),
      image_url: frame.imageUrl,
    }));
  }

  // Extract visual elements from description
  private extractVisualElements(description: string): string[] {
    // Simple extraction - in real app you might use NLP
    const elements: string[] = [];
    const commonElements = [
      'character', 'background', 'lighting', 'objects', 'environment',
      'magical', 'technology', 'artifact', 'workshop', 'shadows'
    ];
    
    commonElements.forEach(element => {
      if (description.toLowerCase().includes(element)) {
        elements.push(element);
      }
    });
    
    return elements.length > 0 ? elements : ['scene elements'];
  }

  // Generate storyboard using Azure Functions endpoint
  async generateStoryboard(request: GenerationRequest): Promise<GenerationResponse> {
    const endpoint = '/generatestoryboard';
    
    try {
      const backendResponse = await this.request<{ title: string; frames: BackendStoryboardFrame[]; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      
      // Check if the backend returned an error
      if (backendResponse.error) {
        return {
          success: false,
          error: backendResponse.error,
        };
      }
      
      // Check if the backend returned an empty array (which indicates failure)
      if (!backendResponse.frames || backendResponse.frames.length === 0) {
        return {
          success: false,
          error: 'The AI service could not generate frames for your story. Please try again with different parameters or check if the service is experiencing high load.',
        };
      }
      
      return {
        success: true,
        title: backendResponse.title,
        frames: backendResponse.frames,
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Unable to connect to the AI service. Please check your internet connection and try again.',
      };
    }
  }

  // Convert backend frames to frontend format (for display)
  convertToFrontendFrames(backendFrames: BackendStoryboardFrame[], request: GenerationRequest): StoryboardFrame[] {
    return this.convertBackendFramesToFrontend(backendFrames, request);
  }

  // Mock implementations for project management (since Azure Functions doesn't have these yet)
  async getProjects(): Promise<StoryboardProject[]> {
    // For now, return empty array - you can implement this later if needed
    return [];
  }

  async getProject(_projectId: string): Promise<StoryboardProject> {
    throw new Error('Project retrieval not implemented yet');
  }

  async updateProject(_projectId: string, _updates: Partial<StoryboardProject>): Promise<StoryboardProject> {
    throw new Error('Project updates not implemented yet');
  }

  async deleteProject(_projectId: string): Promise<{ success: boolean }> {
    throw new Error('Project deletion not implemented yet');
  }

  // User Management API Methods
  async createUser(userData: Omit<any, 'id'>): Promise<any> {
    return this.request('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: string): Promise<any> {
    return this.request(`/user/${userId}`);
  }

  async updateUserUsage(userId: string, usageData: any): Promise<any> {
    return this.request(`/user/${userId}/usage`, {
      method: 'PATCH',
      body: JSON.stringify(usageData),
    });
  }

  // Gallery API Methods
  async getGalleryStories(): Promise<any[]> {
    return this.request('/gallery');
  }

  async addStoryToGallery(storyData: any): Promise<any> {
    return this.request('/gallery', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async likeGalleryStory(storyId: string, userId: string): Promise<any> {
    return this.request(`/gallery/${storyId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // User Stories API Methods
  async getUserStories(userId: string): Promise<any[]> {
    return this.request(`/user/${userId}/stories`);
  }

  async getUserLikedStories(userId: string): Promise<any[]> {
    return this.request(`/user/${userId}/liked-stories`);
  }

  async getUserStatistics(userId: string): Promise<any> {
    return this.request(`/user/${userId}/statistics`);
  }

  async exportStoryboard(project: StoryboardProject, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
    if (format === 'pdf') {
      // Import jsPDF dynamically to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const usableWidth = pageWidth - (margin * 2);
      
      // Set the PDF document title
      doc.setProperties({
        title: project.title,
        author: 'AI Storyboard Weaver',
        subject: 'AI Generated Storyboard',
        creator: 'AI Storyboard Weaver',
        keywords: project.genre ? `storyboard, ${project.genre}, ai generated` : 'storyboard, ai generated'
      });
      
      // TITLE PAGE - First page with project information
      doc.setFontSize(24);
      doc.text('AI Generated Storyboard', pageWidth / 2, 60, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text(project.title, pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Project ID: ${project.id}`, pageWidth / 2, 120, { align: 'center' });
      doc.text(`Generated: ${new Date(project.created_at).toLocaleDateString()}`, pageWidth / 2, 140, { align: 'center' });
      
      if (project.genre) {
        doc.text(`Genre: ${project.genre}`, pageWidth / 2, 160, { align: 'center' });
      }
      
      if (project.style) {
        doc.text(`Style: ${project.style}`, pageWidth / 2, 180, { align: 'center' });
      }
      
      const frames = project.frames;
      
      if (!frames || frames.length === 0) {
        doc.text('No frames found to export.', pageWidth / 2, 220, { align: 'center' });
        return new Blob([doc.output('blob')], { type: 'application/pdf' });
      }
      
      // Add frames summary on title page
      doc.setFontSize(12);
      doc.text(`Total Frames: ${frames.length}`, pageWidth / 2, 200, { align: 'center' });
      
      // Start frames on the next page
      doc.addPage();
      let yPosition = margin;
      
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        // Calculate space needed for this frame
        const imageHeight = 120; // Adjusted for 16:9 aspect ratio (wider, less tall)
        const estimatedTextHeight = 80; // Estimate for text content
        const totalFrameHeight = imageHeight + estimatedTextHeight + 40; // Add padding
        
        // Check if we need a new page (considering frame content)
        if (yPosition + totalFrameHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Frame header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Frame ${i + 1}`, margin, yPosition);
        yPosition += 20;
        
        // Image section - Optimized for 16:9 aspect ratio (1792x1024)
        const imageBoxWidth = usableWidth;
        const imageBoxHeight = imageHeight; // Adjusted height for 16:9 landscape images
        
        if (frame.image_url) {
          try {
            const imageResponse = await fetch(frame.image_url);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              
              // Convert blob to base64
              const base64Image = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(imageBlob);
              });
              
              // Keep original aspect ratio (1792x1024 from DALL-E - 16:9 landscape)
              // Calculate dimensions to fit within our box while maintaining 16:9 aspect ratio
              const aspectRatio = 1792 / 1024; // 1.75 (16:9 aspect ratio)
              let finalWidth = imageBoxWidth;
              let finalHeight = imageBoxWidth / aspectRatio; // Calculate height based on 16:9 ratio
              
              // If the calculated height doesn't fit in our height limit, adjust both dimensions
              if (finalHeight > imageBoxHeight) {
                finalHeight = imageBoxHeight;
                finalWidth = imageBoxHeight * aspectRatio;
              }
              
              // Center the image horizontally if it's smaller than the box width
              const xOffset = margin + (imageBoxWidth - finalWidth) / 2;
              
              // Add the actual image to PDF with original quality
              doc.addImage(base64Image, 'PNG', xOffset, yPosition, finalWidth, finalHeight);
              
              yPosition += finalHeight;
            } else {
              // Fallback to placeholder if download fails
              this.addImagePlaceholder(doc, margin, yPosition, imageBoxWidth, imageBoxHeight, 'Failed to load image');
              yPosition += imageBoxHeight;
            }
          } catch (error) {
            // Fallback to placeholder on error
            this.addImagePlaceholder(doc, margin, yPosition, imageBoxWidth, imageBoxHeight, 'Image loading error');
            yPosition += imageBoxHeight;
          }
        } else {
          // No image URL available
          this.addImagePlaceholder(doc, margin, yPosition, imageBoxWidth, imageBoxHeight, 'No image generated');
          yPosition += imageBoxHeight;
        }
        
        yPosition += 15;
        
        // Scene description
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Description:', margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const descriptionLines = doc.splitTextToSize(frame.scene_description, usableWidth);
        doc.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 5 + 10;
        
        // Dialogue
        if (frame.dialogue && frame.dialogue.trim()) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Dialogue:', margin, yPosition);
          yPosition += 8;
          
          doc.setFont('helvetica', 'italic'); // Changed from 'oblique' to 'italic'
          doc.setFontSize(10);
          const dialogueLines = doc.splitTextToSize(`"${frame.dialogue}"`, usableWidth);
          doc.text(dialogueLines, margin, yPosition);
          yPosition += dialogueLines.length * 5 + 10;
        }
        
        // Action Notes
        if (frame.action_notes && frame.action_notes.trim()) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Action Notes:', margin, yPosition);
          yPosition += 8;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const actionLines = doc.splitTextToSize(frame.action_notes, usableWidth);
          doc.text(actionLines, margin, yPosition);
          yPosition += actionLines.length * 5 + 15;
        }
        
        // Add a separator line between frames (but not after the last frame)
        if (i < frames.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 20;
        }
      }
      
      return new Blob([doc.output('blob')], { type: 'application/pdf' });
    }
    
    throw new Error('Only PDF export is currently supported');
  }

  // Helper method to add image placeholder
  private addImagePlaceholder(doc: any, x: number, y: number, width: number, height: number, message: string) {
    // Draw a border for the image placeholder
    doc.setDrawColor(150, 150, 150);
    doc.rect(x, y, width, height);
    
    // Add placeholder text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(message, x + width / 2, y + height / 2 - 5, { align: 'center' });
    doc.text('(Image placeholder)', x + width / 2, y + height / 2 + 5, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Simple health check - try to hit the base URL
      const response = await fetch(this.baseUrl);
      if (response.ok) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          status: 'unhealthy - server responded with ' + response.status,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy - ' + (error instanceof Error ? error.message : 'connection failed'),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Utility functions
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Utility function to resize images to 40% of original size for better performance
export const resizeImageToDataURL = (
  imageUrl: string, 
  scaleFactor: number = 0.4
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS for external images
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Calculate new dimensions (40% of original)
      const newWidth = Math.round(img.width * scaleFactor);
      const newHeight = Math.round(img.height * scaleFactor);
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw the resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to data URL with compression
      const dataURL = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      resolve(dataURL);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};
