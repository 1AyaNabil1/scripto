import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { apiClient } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useStoryboardImagePreloader } from '../../hooks';
import LoadingSpinner from '../shared/LoadingSpinner';
import SEO from '../common/SEO';
import type { GalleryStory, StoryboardFrame } from '../../types';

const StoryPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [story, setStory] = useState<GalleryStory | null>(null);
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all gallery stories and find the one with matching ID
        const stories = await apiClient.getGalleryStories();
        const foundStory = stories.find(s => s.id === storyId);
        
        if (!foundStory) {
          setError('Story not found');
          return;
        }
        
        setStory(foundStory);
        
        // Parse frames
        let parsedFrames: StoryboardFrame[] = [];
        if (foundStory.frames) {
          if (typeof foundStory.frames === 'string') {
            try {
              parsedFrames = JSON.parse(foundStory.frames);
            } catch (parseError) {
              console.error('Error parsing frames:', parseError);
            }
          } else if (Array.isArray(foundStory.frames)) {
            parsedFrames = foundStory.frames;
          }
        }
        setFrames(parsedFrames);
        
      } catch (err) {
        setError('Failed to load story');
        console.error('Error fetching story:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  // Preload images for better UX
  useStoryboardImagePreloader(frames);

  const handleLike = async () => {
    if (!story) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await apiClient.likeGalleryStory(story.id, user.id);
      
      // Update the story's like count locally
      setStory(prev => {
        if (!prev) return prev;
        const currentLikes = prev.likes || 0;
        return { ...prev, likes: currentLikes + 1 };
      });
    } catch (error) {
      console.error('Error liking story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to like story. Please try again.';
      
      // If user authentication fails, redirect to auth page
      if (errorMessage.includes('User account not found') || errorMessage.includes('authentication')) {
        navigate('/auth');
        return;
      }
      
      alert(errorMessage);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!story) return;
    
    try {
      await navigator.share({
        title: story.title,
        text: story.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Story link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">{error || 'Story not found'}</p>
          <button
            onClick={() => navigate('/gallery')}
            className="mt-4 btn-primary"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={story.title}
        description={story.description}
        image={frames[0]?.image_url}
      />
      
      <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {story.title}
                </h1>
                <p className="text-neutral-600 mb-2">
                  {story.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
                  <span>by {story.userName || 'Anonymous'}</span>
                  <span>• {frames.length} frames</span>
                  {story.genre && <span>• {story.genre}</span>}
                  <span>• {formatDate(story.createdAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/gallery')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Gallery</span>
                </button>
                
                <button
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={`btn-secondary flex items-center space-x-2 transition-colors ${
                    user 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-gray-400 cursor-not-allowed'
                  } ${isLiking ? 'opacity-50' : ''}`}
                >
                  <Heart className="w-4 h-4" />
                  <span>{isLiking ? 'Liking...' : `Like (${story.likes || 0})`}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Storyboard Grid */}
            {frames.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No frames available for this story.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {frames.map((frame, index) => (
                  <motion.div
                    key={frame.panel_number || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Frame Image */}
                    <div className="aspect-video bg-gray-100 relative">
                      {frame.image_url ? (
                        <img
                          src={frame.image_url}
                          alt={frame.scene_description || `Frame ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                        Frame {frame.panel_number || index + 1}
                      </div>
                    </div>

                    {/* Frame Details */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Frame {frame.panel_number || index + 1}
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Scene Description */}
                        {frame.scene_description && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Scene Description</h5>
                            <p className="text-sm text-gray-600">{frame.scene_description}</p>
                          </div>
                        )}

                        {/* Camera Angle & Mood */}
                        <div className="flex gap-4">
                          {frame.camera_angle && (
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Camera Angle</h5>
                              <p className="text-sm text-gray-600">{frame.camera_angle}</p>
                            </div>
                          )}
                          {frame.mood && (
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Mood</h5>
                              <p className="text-sm text-gray-600">{frame.mood}</p>
                            </div>
                          )}
                        </div>

                        {/* Visual Elements */}
                        {frame.visual_elements && frame.visual_elements.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Visual Elements</h5>
                            <div className="flex flex-wrap gap-1">
                              {frame.visual_elements.map((element, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {element}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dialogue */}
                        {frame.dialogue && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Dialogue</h5>
                            <p className="text-sm text-gray-600 italic">"{frame.dialogue}"</p>
                          </div>
                        )}

                        {/* Action Notes */}
                        {frame.action_notes && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Action Notes</h5>
                            <p className="text-sm text-gray-600">{frame.action_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Story Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white rounded-lg p-6 text-center shadow-md">
                <h3 className="text-2xl font-bold text-emerald-600 mb-2">
                  {frames.length}
                </h3>
                <p className="text-neutral-600">Total Frames</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center shadow-md">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">
                  {frames.filter(f => f.dialogue).length}
                </h3>
                <p className="text-neutral-600">Frames with Dialogue</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center shadow-md">
                <h3 className="text-2xl font-bold text-emerald-600 mb-2">
                  {story.likes || 0}
                </h3>
                <p className="text-neutral-600">Likes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
    </>
  );
};

export default StoryPage;
