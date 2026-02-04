import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, User, Calendar, Eye, Image as ImageIcon } from 'lucide-react';
import type { GalleryStory } from '../../types';
import { Card, Badge, Button } from '../ui';
import { CachedImage } from '../common';

interface GalleryCardProps {
  story: GalleryStory;
  currentUserId?: string;
  onLike: (storyId: string) => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  story,
  currentUserId,
  onLike,
}) => {
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;
    
    setIsLiking(true);
    await onLike(story.id);
    setIsLiking(false);
  };

  // Parse frames properly and get correct count
  const frames = useMemo(() => {
    if (!story.frames) return [];
    
    if (typeof story.frames === 'string') {
      try {
        return JSON.parse(story.frames);
      } catch (error) {
        console.error('Error parsing frames:', error);
        return [];
      }
    }
    
    if (Array.isArray(story.frames)) {
      return story.frames;
    }
    
    return [];
  }, [story.frames]);

  // Get the first frame's image for thumbnail with optimization
  const thumbnailUrl = useMemo(() => {
    if (frames.length > 0 && frames[0]?.image_url) {
      const originalUrl = frames[0].image_url;
      // Add optimization parameters for thumbnails
      const optimizedUrl = originalUrl.includes('?') 
        ? `${originalUrl}&w=400&h=300&fit=crop` 
        : `${originalUrl}?w=400&h=300&fit=crop`;
      return optimizedUrl;
    }
    return null;
  }, [frames]);

  const handleViewStory = () => {
    navigate(`/stories/${story.id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === 'Invalid Date') return 'Recent';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const isLiked = false; // TODO: Implement like tracking
  const likeCount = story.likes || 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        padding="md"
        shadow="md"
        rounded="xl"
        hover
        className="h-full flex flex-col"
      >
        {/* Thumbnail */}
        <div className="relative mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {thumbnailUrl ? (
            <CachedImage
              src={thumbnailUrl}
              alt={story.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              placeholder={
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          
          {/* Frame count overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant="default" size="sm" className="bg-black/70 text-black">
              {frames.length} frames
            </Badge>
          </div>

          {/* Genre badge */}
          {story.genre && (
            <div className="absolute top-2 left-2">
              <Badge variant="primary" size="sm">
                {story.genre}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {story.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {story.description}
            </p>
          </div>

          {/* Style badge */}
          {story.style && (
            <div className="mb-4">
              <Badge variant="secondary" size="sm">
                {story.style}
              </Badge>
            </div>
          )}

          {/* Meta information */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{story.user_name || story.userName || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(story.created_at || story.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {/* Like button */}
              <button
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-red-500'
                } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart 
                  className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${
                    isLiking ? 'animate-pulse' : ''
                  }`} 
                />
                <span>{likeCount}</span>
              </button>
            </div>

            {/* View button */}
            <Button
              variant="outline"
              size="sm"
              icon={Eye}
              iconPosition="left"
              onClick={handleViewStory}
            >
              View Story
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
