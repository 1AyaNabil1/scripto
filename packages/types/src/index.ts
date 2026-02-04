// Backend API types (matching Azure Functions response)
export interface BackendStoryboardFrame {
  description: string;
  dialogue: string;
  actionNote: string;
  imageUrl: string;
}

// Frontend display types (converted from backend)
export interface StoryboardFrame {
  panel_number: number;
  scene_description: string;
  visual_elements: string[];
  camera_angle: string;
  mood: string;
  dialogue?: string;
  action_notes?: string;
  timestamp?: string;
  image_url?: string;
}

export interface StoryboardProject {
  id: string;
  title: string;
  description: string;
  frames: StoryboardFrame[];
  created_at: string;
  updated_at: string;
  genre?: string;
  style?: string;
  total_frames: number;
}

// User types
export interface User {
  id: string;
  name: string;
  email?: string; // For authenticated users
  deviceId?: string; // Optional for backward compatibility
  createdAt: string;
  dailyUsageCount: number;
  lastUsageDate: string;
  isEmailVerified?: boolean; // For authenticated users
}

// Authentication types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse extends User {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Gallery types
export interface GalleryStory {
  id: string;
  title: string;
  description: string;
  frames: StoryboardFrame[] | string; // Can be JSON string from database
  createdAt: string;
  created_at?: string; // Database field name
  userName: string;
  user_name?: string; // Database field name
  userId: string;
  user_id?: string; // Database field name
  genre?: string;
  style?: string;
  totalFrames: number;
  total_frames?: number; // Database field name
  likes: number;
  isPublic: boolean;
  is_public?: boolean; // Database field name
}

// API Request types (matching your Azure Functions endpoint)
export interface GenerationRequest {
  prompt: string;
  genre?: string;
  visualStyle?: string;
  mood?: string;
  frameCount?: number;
  cameraAngles?: string[];
  includeDialogue?: boolean;
  includeActionNotes?: boolean;
  userId?: string;
}

// Simplified response from backend
export interface GenerationResponse {
  success: boolean;
  title?: string;
  frames?: BackendStoryboardFrame[];
  remainingUsage?: number;
  error?: string;
  processing_time?: number;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}

// UI State types
export interface AppState {
  isGenerating: boolean;
  currentProject: StoryboardProject | null;
  projects: StoryboardProject[];
  error: string | null;
  user: User | null;
  galleryStories: GalleryStory[];
  isLoadingGallery: boolean;
}

// Component Props types
export interface StoryInputProps {
  onGenerate: (request: GenerationRequest) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export interface StoryboardViewerProps {
  project: StoryboardProject;
  onEdit?: (frameIndex: number) => void;
  onExport?: () => void;
}

export interface FrameCardProps {
  frame: StoryboardFrame;
  index: number;
  onEdit?: () => void;
}
