import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { NAVIGATION_ITEMS } from './constants';
import {
  Header,
  Footer,
  Home,
  TryApp,
  Gallery,
  About,
  StoryPage,
  NotFound
} from './components';
import { AuthPage } from './components/pages/AuthPage';
import { PasswordResetPage } from './components/pages/PasswordResetPage';
import { AdminDashboard, AdminUsers, AdminStories } from './components/pages/admin';
import ProfileSettings from './components/pages/ProfileSettings';
import MyStories from './components/pages/MyStories';
import LikedStories from './components/pages/LikedStories';
import UsageStatistics from './components/pages/UsageStatistics';
import { ScrollToTop, ScrollToTopButton, RedirectTo404 } from './components/common';

// Main App Component with Router Navigation
function AppContent() {
  const { 
    user,
    isLoading
  } = useAuthContext();

  const navigation = [...NAVIGATION_ITEMS];

  // Show loading while initializing user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ScrollToTop component for smooth page transitions */}
      <ScrollToTop />
      
      {/* Floating scroll to top button */}
      <ScrollToTopButton />
      
      <Routes>
        {/* Standalone Routes - No Header/Footer */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/404" element={<NotFound />} />
        
        {/* Admin Routes - Standalone with own navigation */}
        <Route path="/admin" element={
          <div className="pt-20 pb-12">
            <AdminDashboard />
          </div>
        } />
        <Route path="/admin/users" element={
          <div className="pt-20 pb-12">
            <AdminUsers />
          </div>
        } />
        <Route path="/admin/stories" element={
          <div className="pt-20 pb-12">
            <AdminStories />
          </div>
        } />
        
        {/* All other routes with Header/Footer layout */}
        <Route path="/*" element={
          <div className="min-h-screen bg-stone-50 flex flex-col">
            <Header 
            projectName="Scripto" 
            navigation={navigation}
            showBackToMain={true}
          />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              
              {/* Gallery Route - Public */}
              <Route path="/gallery" element={
                <div className="pt-20 pb-12">
                  <Gallery />
                </div>
              } />
              
              {/* Individual Story Route - Public */}
              <Route path="/stories/:storyId" element={
                <div className="pt-20 pb-12">
                  <StoryPage />
                </div>
              } />
              
              {/* About Route - Public */}
              <Route path="/about" element={
                <div className="pt-20 pb-12">
                  <About />
                </div>
              } />
              
              {/* Try App Route - Public but disabled without auth */}
              <Route path="/try-app" element={
                <div className="pt-20 pb-12">
                  <TryApp user={user} />
                </div>
              } />
              
              {/* User Profile Routes - Require Authentication */}
              <Route path="/profile" element={
                <div className="pt-20 pb-12">
                  <ProfileSettings />
                </div>
              } />
              
              <Route path="/my-stories" element={
                <div className="pt-20 pb-12">
                  <MyStories />
                </div>
              } />
              
              <Route path="/liked-stories" element={
                <div className="pt-20 pb-12">
                  <LikedStories />
                </div>
              } />
              
              <Route path="/usage-stats" element={
                <div className="pt-20 pb-12">
                  <UsageStatistics />
                </div>
              } />
              
              {/* Catch all unmatched routes - Redirect to standalone 404 */}
              <Route path="*" element={<RedirectTo404 />} />
            </Routes>
          </main>

          <Footer />
        </div>
      } />
    </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
