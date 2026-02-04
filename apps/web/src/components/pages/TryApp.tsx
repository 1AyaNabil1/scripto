import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryInput from '../features/StoryInput';
import StoryboardViewer from '../features/StoryboardViewer';
import { GeneratingStoryboard } from '../shared/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useStoryboard } from '../../hooks/useStoryboard';
import { useGallery } from '../../hooks/useGallery';
import { useAuthContext } from '../../contexts/AuthContext';
import SEO from '../common/SEO';
import type { GenerationRequest, User } from '../../types';

type AppView = 'input' | 'generating' | 'viewing' | 'error';

interface TryAppProps {
  user: User | null;
}

const TryApp: React.FC<TryAppProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<AppView>('input');
  const [lastRequest, setLastRequest] = useState<GenerationRequest | null>(null);
  const {
    isGenerating,
    currentProject,
    generateStoryboard,
    exportProject,
    clearError,
  } = useStoryboard();
  const { addToGallery } = useGallery();
  const { canUseService, updateUsage } = useAuthContext();

  const handleGenerate = async (request: GenerationRequest) => {
    try {
      // Check if user can use the service
      if (!user || !canUseService()) {
        throw new Error('You have reached your daily limit of 3 storyboards. Please try again tomorrow.');
      }

      setLastRequest(request);
      setCurrentView('generating');
      
      // Add user ID to the request
      const requestWithUser = { ...request, userId: user.id };
      
      await generateStoryboard(requestWithUser);
      
      // Only update usage count after successful generation
      setCurrentView('viewing');
      
      // Update user usage count after successful creation
      await updateUsage();
      
    } catch (err) {
      console.error('🚨 Storyboard generation failed:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        request: request,
        timestamp: new Date().toISOString()
      });
      setCurrentView('error');
    }
  };

  const handleShareToGallery = async () => {
    if (!currentProject || !user) {
      return false;
    }

    try {
      const success = await addToGallery(currentProject, user.id, user.name);
      return success;
    } catch (error) {
      console.error('Error sharing to gallery:', error);
      return false;
    }
  };

  const handleRetry = () => {
    if (lastRequest) {
      console.log('🔄 Retrying with last request:', lastRequest);
      handleGenerate(lastRequest);
    } else {
      console.warn('⚠️ No previous request found for retry');
      handleBackToInput();
    }
  };

  const handleDismiss = () => {
    console.log('✖️ User dismissed error, returning to input');
    clearError();
    setCurrentView('input');
  };

  const handleExport = async () => {
    if (currentProject) {
      try {
        console.log('📄 Exporting project to PDF:', currentProject.id);
        await exportProject(currentProject, 'pdf');
      } catch (err) {
        console.error('🚨 Export failed:', err);
        // You could show a toast notification here instead of changing the main view
      }
    }
  };

  const handleBackToInput = () => {
    setCurrentView('input');
    setLastRequest(null);
    clearError();
  };

  return (
    <>
      <SEO 
        title="Try Scripto - Create Your Storyboard"
        description="Create your own AI-generated storyboard. Input your story and watch as AI transforms it into a visual storyboard with scenes and images."
        keywords="Scripto, create storyboard, AI storyboard generator, story to storyboard"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating sign-in overlay if no user */}
        {!user && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  V
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Welcome to Scripto!
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Transform your stories into stunning visual storyboards with AI. 
                  Sign in to start creating up to 3 storyboards per day, completely free!
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign In to Get Started
                  </button>
                  <p className="text-sm text-gray-500">
                    No account? <span className="text-emerald-600 font-medium">Sign up is quick and free!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show usage warning if user has no remaining usage */}
        {user && !canUseService() && (
          <div className="text-center mb-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-orange-900 mb-2">
              Daily Limit Reached
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-orange-700">
              You've reached your daily limit of 3 storyboards. 
              Please come back tomorrow to create more amazing stories!
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentView === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <StoryInput
                onGenerate={handleGenerate}
                isLoading={isGenerating}
                disabled={!user || !canUseService()}
              />
            </motion.div>
          )}

          {currentView === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <GeneratingStoryboard />
            </motion.div>
          )}

          {currentView === 'viewing' && currentProject && (
            <motion.div
              key="viewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <StoryboardViewer
                project={currentProject}
                onExport={handleExport}
                onShareToGallery={handleShareToGallery}
                user={user}
              />
              
              {/* Action Buttons */}
              <div className="flex justify-center mt-8">
                {/* Back to Create Button */}
                <button
                  onClick={handleBackToInput}
                  className="btn-primary"
                >
                  Create Another Storyboard
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ErrorMessage
                onRetry={handleRetry}
                onClear={handleDismiss}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TryApp;
