import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wand2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  variant?: 'spinner' | 'pulse' | 'dots';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...',
  variant = 'spinner',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    accent: 'text-emerald-600'
  };

  const containerClasses = `flex flex-col items-center justify-center space-y-4 ${className}`;

  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full bg-current opacity-20`}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut'
                }}
                className={`w-2 h-2 ${colorClasses[color]} bg-current rounded-full`}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
          </motion.div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      {renderSpinner()}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-sm font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

interface GeneratingStoryboardProps {
  message?: string;
  className?: string;
}

export const GeneratingStoryboard: React.FC<GeneratingStoryboardProps> = ({ 
  message = 'Generating your storyboard...',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`max-w-md mx-auto text-center py-12 ${className}`}
    >
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6"
        >
          <Wand2 className="w-8 h-8 text-white" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Creating Magic
        </h3>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-center space-x-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
              key={index}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut'
              }}
              className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;
