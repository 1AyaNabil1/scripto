import React from 'react';
import { motion } from 'framer-motion';
import type { GalleryStory } from '../../types';
import { GalleryCard } from './GalleryCard';
import { Container } from '../ui';

interface GalleryGridProps {
  stories: GalleryStory[];
  currentUserId?: string;
  onLike: (storyId: string) => void;
  isLoading?: boolean;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  stories,
  currentUserId,
  onLike,
  isLoading = false
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-md animate-pulse"
            >
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Container>
    );
  }

  if (stories.length === 0) {
    return (
      <Container maxWidth="4xl">
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stories Found</h3>
          <p className="text-gray-600 mb-6">Be the first to share your creative storyboard!</p>
          <a
            href="/try-app"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg transition-all duration-200"
          >
            Create Your First Story
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="7xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {stories.map((story) => (
          <motion.div
            key={story.id}
            variants={itemVariants}
            layout
          >
            <GalleryCard
              story={story}
              currentUserId={currentUserId}
              onLike={onLike}
            />
          </motion.div>
        ))}
      </motion.div>
    </Container>
  );
};
