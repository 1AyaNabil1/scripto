import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Calendar, Image, Filter } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router';
import SEO from '../common/SEO';
import Button from '../ui/Button';
import { apiClient } from '../../lib/utils';

interface LikedStory {
  id: string;
  title: string;
  description: string;
  author: string;
  likedAt: string;
  imageCount: number;
  thumbnailUrl?: string;
  likes: number;
}

type SortOption = 'recent' | 'popular' | 'oldest';

const LikedStories: React.FC = () => {
  const { user } = useAuthContext();
  const [stories, setStories] = useState<LikedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    const fetchLikedStories = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setError(null);
        const data = await apiClient.getUserLikedStories(user.id);
        
        // Map the data to LikedStory interface
        const mappedStories: LikedStory[] = data.map((story: any) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          author: story.userName || story.user_name,
          likedAt: story.likedAt || new Date().toISOString(),
          imageCount: story.totalFrames || story.total_frames || 0,
          thumbnailUrl: story.thumbnailUrl || (story.frames?.[0]?.image_url),
          likes: story.likes || 0,
        }));
        
        setStories(mappedStories);
      } catch (err) {
        console.error('Error fetching liked stories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load liked stories');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLikedStories();
  }, [user?.id]);

  const handleUnlike = async (storyId: string) => {
    if (!user?.id) return;
    
    try {
      await apiClient.likeGalleryStory(storyId, user.id);
      setStories(stories.filter(story => story.id !== storyId));
    } catch (err) {
      console.error('Error unliking story:', err);
      alert('Failed to unlike story. Please try again.');
    }
  };

  const sortedStories = [...stories].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime();
      case 'popular':
        return b.likes - a.likes;
      case 'oldest':
        return new Date(a.likedAt).getTime() - new Date(b.likedAt).getTime();
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <SEO 
        title="Liked Stories | Scripto"
        description="View all the stories you've liked on Scripto"
      />
      
      <div className="min-h-screen bg-stone-50">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center mb-6">
              <Heart className="w-16 h-16" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center">
              Liked Stories
            </h1>
            <p className="text-lg text-blue-100 text-center max-w-2xl mx-auto">
              Your collection of favorite stories from the community
            </p>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-stone-800">
              {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}
            </h2>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-stone-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="recent">Recently Liked</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="aspect-video bg-stone-200" />
                  <div className="p-6">
                    <div className="h-6 bg-stone-200 rounded mb-3" />
                    <div className="h-4 bg-stone-200 rounded w-2/3 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-10 bg-stone-200 rounded flex-1" />
                      <div className="h-10 bg-stone-200 rounded flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && stories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <Heart className="w-24 h-24 text-stone-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-stone-800 mb-3">No Liked Stories Yet</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                Start exploring the gallery and like stories that inspire you!
              </p>
              <Link to="/gallery">
                <Button variant="primary" className="flex items-center gap-2 mx-auto">
                  <Eye className="w-5 h-5" />
                  Explore Gallery
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Stories Grid */}
          <AnimatePresence mode="popLayout">
            {!isLoading && sortedStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedStories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center relative">
                      {story.thumbnailUrl ? (
                        <img
                          src={story.thumbnailUrl}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-16 h-16 text-stone-400" />
                      )}
                      
                      {/* Unlike Button */}
                      <button
                        onClick={() => handleUnlike(story.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
                        aria-label="Unlike story"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-stone-800 mb-2 truncate">
                        {story.title}
                      </h3>
                      <p className="text-stone-600 text-sm mb-3 line-clamp-2">
                        {story.description}
                      </p>
                      
                      <p className="text-stone-500 text-sm mb-4">
                        by <span className="font-medium text-stone-700">{story.author}</span>
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(story.likedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {story.likes} likes
                        </div>
                      </div>

                      {/* Actions */}
                      <Link to={`/story/${story.id}`}>
                        <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Story
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default LikedStories;
