import React from 'react';
import { motion } from 'framer-motion';
import { Camera, MessageSquare, Edit3, Clock } from 'lucide-react';
import type { FrameCardProps } from '../../types';
import { Card, Badge } from '../ui';
import ResizedImage from '../common/ResizedImage';

const FrameCard: React.FC<FrameCardProps> = ({ frame, index, onEdit }) => {
  return (
    <Card
      padding="lg"
      shadow="md"
      rounded="xl"
      hover
      className="relative"
    >
      {/* Frame Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="font-semibold text-sm text-white">
              {frame.panel_number || index + 1}
            </span>
          </div>
          <h3 className="font-medium text-neutral-900">
            Frame {frame.panel_number || index + 1}
          </h3>
        </div>
        
        {onEdit && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
            aria-label="Edit frame"
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Image Section */}
      <div className="bg-neutral-100 rounded-lg mb-4 aspect-video flex items-center justify-center overflow-hidden">
        {frame.image_url ? (
          <ResizedImage
            src={frame.image_url}
            alt={`Storyboard frame ${frame.panel_number || index + 1}`}
            className="w-full h-full object-cover rounded-lg"
            scaleFactor={0.4}
          />
        ) : (
          <div className="text-center text-neutral-400">
            <Camera className="w-12 h-12 mx-auto mb-2 text-neutral-400" />
            <p className="text-sm">Image will be generated</p>
          </div>
        )}
      </div>

      {/* Scene Description */}
      <div className="mb-4">
        <h4 className="text-xs sm:text-sm md:text-base font-medium text-neutral-700 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Scene Description
        </h4>
        <p className="text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed">
          {frame.scene_description}
        </p>
      </div>

      {/* Visual Elements */}
      {frame.visual_elements && frame.visual_elements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Visual Elements</h4>
          <div className="flex flex-wrap gap-1">
            {frame.visual_elements.map((element, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                size="sm"
              >
                {element}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Camera Angle & Mood */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {frame.camera_angle && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Camera
            </h4>
            <Badge variant="primary" size="sm">
              {frame.camera_angle}
            </Badge>
          </div>
        )}
        
        {frame.mood && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-1">Mood</h4>
            <Badge variant="success" size="sm">
              {frame.mood}
            </Badge>
          </div>
        )}
      </div>

      {/* Dialogue */}
      {frame.dialogue && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Dialogue
          </h4>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
            <p className="text-sm text-blue-800 italic">"{frame.dialogue}"</p>
          </div>
        </div>
      )}

      {/* Action Notes */}
      {frame.action_notes && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Action Notes</h4>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
            <p className="text-sm text-amber-800">{frame.action_notes}</p>
          </div>
        </div>
      )}

      {/* Timestamp */}
      {frame.timestamp && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-4 pt-4 border-t border-neutral-100">
          <Clock className="w-3 h-3" />
          <span>Generated: {new Date(frame.timestamp).toLocaleString()}</span>
        </div>
      )}
    </Card>
  );
};

export default FrameCard;
