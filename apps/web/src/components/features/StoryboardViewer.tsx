import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, ArrowLeft } from 'lucide-react';
import type { StoryboardViewerProps } from '../../types';
import FrameCard from './FrameCard';

const StoryboardViewer: React.FC<StoryboardViewerProps & {
  onShareToGallery?: () => Promise<boolean>;
  user?: any;
}> = ({ 
  project, 
  onEdit, 
  onExport,
  onShareToGallery,
  user
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShareToGallery = async () => {
    if (!onShareToGallery || !user) return;
    
    setIsSharing(true);
    try {
      const success = await onShareToGallery();
      setShareSuccess(success);
      if (success) {
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing to gallery:', error);
    } finally {
      setIsSharing(false);
    }
  };
  return (
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
            {project.title}
          </h1>
          <p className="text-neutral-600">
            {project.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
            <span>{project.total_frames} frames</span>
            {project.genre && <span>• {project.genre}</span>}
            {project.style && <span>• {project.style}</span>}
            <span>• Created {new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          {onExport && (
            <button
              onClick={onExport}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          )}
          
          {/* Share to Gallery Button */}
          {user && onShareToGallery && (
            <button
              onClick={handleShareToGallery}
              disabled={isSharing}
              className={`btn-secondary flex items-center space-x-2 ${
                shareSuccess ? 'bg-green-100 text-green-700' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {isSharing ? 'Sharing...' : shareSuccess ? 'Shared!' : 'Share to Gallery'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Storyboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {project.frames.map((frame, index) => (
          <motion.div
            key={frame.panel_number || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <FrameCard
              frame={frame}
              index={index}
              onEdit={onEdit ? () => onEdit(index) : undefined}
            />
          </motion.div>
        ))}
      </div>

      {/* Project Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-emerald-600 mb-2">
            {project.total_frames}
          </h3>
          <p className="text-neutral-600">Total Frames</p>
        </div>
        
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-blue-600 mb-2">
            {project.frames.filter(f => f.dialogue).length}
          </h3>
          <p className="text-neutral-600">Frames with Dialogue</p>
        </div>
        
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-emerald-600 mb-2">
            {new Set(project.frames.map(f => f.camera_angle)).size}
          </h3>
          <p className="text-neutral-600">Camera Angles Used</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoryboardViewer;
