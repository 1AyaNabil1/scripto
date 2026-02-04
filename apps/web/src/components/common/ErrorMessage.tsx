import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  onRetry?: () => void;
  onClear?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  onRetry, 
  onClear
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-900">
              Generation Failed
            </h3>
          </div>
        </div>
        
        <p className="text-red-700 mb-6 leading-relaxed">
          We encountered an issue while generating your storyboard. This could be due to high server load or a temporary service interruption. Please try again in a moment.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
          
          {onClear && (
            <button
              onClick={onClear}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <span>Dismiss</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorMessage;
