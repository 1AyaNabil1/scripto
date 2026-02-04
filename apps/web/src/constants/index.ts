// Navigation items
export const NAVIGATION_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Try Scripto', href: '/try-app' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' },
] as const;

// Application metadata
export const APP_CONFIG = {
  name: 'Scripto',
  tagline: 'AI-Powered Visual Storytelling',
  description: 'Create professional storyboards from text using AI. Generate visual narratives with advanced AI models, multiple art styles, and instant export options.',
  url: 'https://Scripto.ashraf.zone',
  author: {
    name: 'Ashraf Abdulkhaliq',
    url: 'https://ashraf.zone',
    email: 'ayanabil297@gmail.com'
  }
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071',
  endpoints: {
    stories: '/api/stories',
    gallery: '/api/gallery',
    users: '/api/users',
    like: '/api/like'
  }
} as const;

// UI Constants
export const UI_CONFIG = {
  animations: {
    duration: {
      fast: 0.2,
      normal: 0.3,
      slow: 0.6
    },
    easing: 'easeInOut'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const;
