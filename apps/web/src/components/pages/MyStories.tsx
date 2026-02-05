import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, Eye, Trash2, Calendar, Image } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router';
import SEO from '../common/SEO';
import Button from '../ui/Button';
import { apiClient } from '../../lib/utils';

interface Story {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  totalFrames: number;
  thumbnailUrl?: string;
  frames?: any[];
}

const MyStories: React.FC = () => {
  const { user } = useAuthContext();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setError(null);
        const data = await apiClient.getUserStories(user.id);
        
        // Map the data to Story interface
        const mappedStories: Story[] = data.map((story: any) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          createdAt: story.createdAt || story.created_at,
          totalFrames: story.totalFrames || story.total_frames || 0,
          thumbnailUrl: story.thumbnailUrl || (story.frames?.[0]?.image_url),
          frames: story.frames,
        }));
        
        setStories(mappedStories);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stories');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStories();
  }, [user?.id]);

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }
    
    try {
      // For now, just remove from UI - actual delete would need admin API
      setStories(stories.filter(story => story.id !== storyId));
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Failed to delete story. Please try again.');
    }
  };

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
        title="My Stories | Scripto"
        description="View and manage all your created stories"
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
              <History className="w-16 h-16" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center">
              My Stories
            </h1>
            <p className="text-lg text-blue-100 text-center max-w-2xl mx-auto">
              View and manage all your created stories
            </p>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-stone-800">
              {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}
            </h2>
            <Link to="/try">
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Story
              </Button>
            </Link>
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
              <History className="w-24 h-24 text-stone-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-stone-800 mb-3">No Stories Yet</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                You haven't created any stories yet. Start creating your first storyboard now!
              </p>
              <Link to="/try">
                <Button variant="primary" className="flex items-center gap-2 mx-auto">
                  <Plus className="w-5 h-5" />
                  Create Your First Story
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Stories Grid */}
          <AnimatePresence mode="popLayout">
            {!isLoading && stories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {story.thumbnailUrl ? (
                        <img
                          src={story.thumbnailUrl}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-16 h-16 text-stone-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-stone-800 mb-2 truncate">
                        {story.title}
                      </h3>
                      <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                        {story.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(story.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          {story.totalFrames} images
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link to={`/story/${story.id}`} className="flex-1">
                          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteStory(story.id)}
                          className="flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

export default MyStories;
