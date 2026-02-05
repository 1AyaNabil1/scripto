import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { GalleryGrid } from '../gallery/GalleryGrid';
import { useGallery } from '../../hooks/useGallery';
import { useGalleryImagePreloader } from '../../hooks';
import { useAuthContext } from '../../contexts/AuthContext';
import { adminApiClient } from '../../lib/adminApi';
import SEO from '../common/SEO';
import SiteStructuredData from '../common/SiteStructuredData';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { 
    galleryStories, 
    isLoading, 
    error,
    removeStory,
    likeStory
  } = useGallery();
  
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');

  // Available filter options
  const genres = ['all', 'Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Fantasy', 'Romance', 'Thriller'];
  const styles = ['all', 'Realistic', 'Cartoon', 'Anime', 'Comic Book', 'Cinematic', 'Minimalist'];

  // Filter stories based on search and filters
  const filteredStories = galleryStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === 'all' || story.genre === genreFilter;
    const matchesStyle = styleFilter === 'all' || story.style === styleFilter;
    return matchesSearch && matchesGenre && matchesStyle;
  });

  // Preload gallery images for better UX
  useGalleryImagePreloader(
    filteredStories.flatMap(story => {
      // Extract image URLs from frames
      let frames: any[] = [];
      if (typeof story.frames === 'string') {
        try {
          frames = JSON.parse(story.frames);
        } catch (e) {
          console.warn('Failed to parse frames for preloading:', e);
        }
      } else if (Array.isArray(story.frames)) {
        frames = story.frames;
      }
      return frames.filter(frame => frame.image_url).map(frame => ({ image_url: frame.image_url }));
    }),
    !isLoading
  );

  const handleLike = async (storyId: string) => {
    if (!user || !user.email) {
      navigate('/auth');
      return;
    }
    
    try {
      await likeStory(storyId, user.email);
    } catch (error) {
      console.error('Error liking story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to like story. Please try again.';
      
      // If user doesn't exist in database, redirect to auth
      if (errorMessage.includes('User account not found')) {
        localStorage.removeItem('authToken');
        navigate('/auth');
        return;
      }
      
      alert(errorMessage);
    }
  };

  // Admin delete handler
  const handleDelete = useCallback(async (storyId: string) => {
    if (!isAdmin) return;
    
    try {
      await adminApiClient.deleteStory(storyId);
      removeStory(storyId);
    } catch (error) {
      console.error('Error deleting story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete story. Please try again.';
      alert(errorMessage);
      throw error;
    }
  }, [isAdmin, removeStory]);

  return (
    <>
      <SEO 
        title="Gallery - Discover Amazing AI-Generated Storyboards | Scripto"
        description="Explore incredible storyboards created by the Scripto community. Discover stories across genres like Action, Drama, Comedy, and more. Filter by art styles and find inspiration from fellow creators."
        keywords="storyboard gallery, AI-generated stories, creative community, visual storytelling showcase, Scripto gallery, story inspiration, digital art gallery"
        url="https://Scripto.ashraf.zone/gallery"
      />
      <SiteStructuredData type="website" />
      
      <div className="min-h-screen bg-stone-50">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
              Storyboard Gallery
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Explore amazing storyboards created with AI-powered storytelling
            </p>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8"
          >
            {/* Mobile-First Layout */}
            <div className="space-y-4">
              {/* Search - Full Width on Mobile */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search storyboards, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Filter Icon + Label (Hidden on Mobile, Shown on Desktop) */}
                <div className="hidden sm:flex items-center gap-2 text-gray-600">
                  <Filter className="w-5 h-5" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                {/* Filter Dropdowns - Responsive Grid */}
                <div className="flex-1 grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                  {/* Genre Filter */}
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-w-0 sm:min-w-[130px] bg-white"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre === 'all' ? 'All Genres' : genre}
                      </option>
                    ))}
                  </select>

                  {/* Style Filter */}
                  <select
                    value={styleFilter}
                    onChange={(e) => setStyleFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-w-0 sm:min-w-[130px] bg-white"
                  >
                    {styles.map(style => (
                      <option key={style} value={style}>
                        {style === 'all' ? 'All Styles' : style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6"
          >
            <p className="text-gray-600">
              {isLoading ? 'Loading...' : `${filteredStories.length} storyboard${filteredStories.length !== 1 ? 's' : ''} found`}
            </p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <GalleryGrid
            stories={filteredStories}
            isLoading={isLoading}
            currentUserId={user?.id}
            onLike={handleLike}
            isAdmin={isAdmin}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </>
  );
};

export default Gallery;
