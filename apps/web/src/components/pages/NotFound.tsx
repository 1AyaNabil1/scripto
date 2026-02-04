import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import SEO from '../common/SEO';

const NotFound: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 flex items-center justify-center px-4"
    >
      <SEO
        title="Page Not Found - Scripto"
        description="The page you're looking for doesn't exist. Return to Scripto to continue creating amazing storyboards."
      />
      
      <div className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* 404 Animation */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <div className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              404
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-neutral-600 mb-2">
              The page you're looking for seems to have vanished into the digital void.
            </p>
            <p className="text-base text-neutral-500">
              Don't worry though, your creativity is still here waiting for you!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/">
              <button className="flex items-center space-x-2 min-w-[160px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                <Home className="w-5 h-5" />
                <span>Go Home</span>
              </button>
            </Link>

            <Link to="/try-app">
              <button className="flex items-center space-x-2 min-w-[160px] px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors duration-200">
                <Search className="w-5 h-5" />
                <span>Try App</span>
              </button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 min-w-[160px] px-6 py-3 bg-transparent hover:bg-gray-100 text-gray-600 font-semibold rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">
              Looking for something specific?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <Link 
                to="/" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                🏠 Home Page
              </Link>
              <Link 
                to="/gallery" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                🖼️ Gallery
              </Link>
              <Link 
                to="/about" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ℹ️ About Us
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound;
