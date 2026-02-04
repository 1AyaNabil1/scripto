import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthForm } from '../auth/AuthForm';
import { PasswordResetRequest } from '../auth/PasswordResetRequest';
import { PasswordReset } from '../auth/PasswordReset';
import { useAuthContext } from '../../contexts/AuthContext';
import SEO from '../common/SEO';
import StructuredData from '../common/StructuredData';

export const AuthPage: React.FC = () => {
  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuthContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const mode = searchParams.get('mode') || 'login'; // login, forgot, reset
  const token = searchParams.get('token');
  
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>(
    token ? 'reset' : mode as 'login' | 'forgot' | 'reset'
  );

  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      // Navigation will be handled by the useEffect above when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by the login function
    }
  };

  const handleRegister = async (userData: { name: string; email: string; password: string }) => {
    try {
      await register(userData);
      // User stays logged in and navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by the register function
    }
  };

  const handleForgotPassword = () => {
    setAuthMode('forgot');
  };

  const handleBackToLogin = () => {
    setAuthMode('login');
  };

  const getPageTitle = () => {
    switch (authMode) {
      case 'forgot': return 'Reset Password - Scripto';
      case 'reset': return 'Set New Password - Scripto';
      default: return 'Sign In - Scripto';
    }
  };

  const getPageDescription = () => {
    switch (authMode) {
      case 'forgot': return 'Reset your Scripto account password to regain access to your storyboards.';
      case 'reset': return 'Set a new password for your Scripto account.';
      default: return 'Sign in to your Scripto account to create amazing AI-powered storyboards and manage your projects.';
    }
  };

  return (
    <>
      <SEO 
        title={getPageTitle()}
        description={getPageDescription()}
        keywords="login, sign in, authentication, account, storyboard, AI, password reset"
      />
      
      <StructuredData 
        type="WebPage"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": getPageTitle(),
          "description": getPageDescription(),
          "url": typeof window !== 'undefined' ? window.location.href : '',
        }}
      />

      <div className="min-h-screen flex">
        {/* Left Side - Demo/Branding */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-1000"></div>
            <div className="absolute top-1/3 right-20 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-500"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full w-full text-center text-white">
            {/* Logo */}
            <div className="mb-8">
              <Link 
                to="/"
                className="text-5xl font-bold bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
                }}
              >
                Scripto
              </Link>
            </div>

            {/* Enhanced Demo Mockup */}
            <div className="w-full max-w-sm">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 hover:scale-105">
                {/* Storyboard Demo Grid */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <div className="flex-1 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center group hover:from-white/30 hover:to-white/20 transition-all duration-300">
                      <div className="w-10 h-8 bg-white/40 rounded-lg shadow-sm group-hover:bg-white/50 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center group hover:from-white/30 hover:to-white/20 transition-all duration-300">
                      <div className="w-10 h-8 bg-white/40 rounded-lg shadow-sm group-hover:bg-white/50 transition-all duration-300"></div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="flex-1 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center group hover:from-white/30 hover:to-white/20 transition-all duration-300">
                      <div className="w-10 h-8 bg-white/40 rounded-lg shadow-sm group-hover:bg-white/50 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center group hover:from-white/30 hover:to-white/20 transition-all duration-300">
                      <div className="w-10 h-8 bg-white/40 rounded-lg shadow-sm group-hover:bg-white/50 transition-all duration-300"></div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs opacity-80">
                    <span>Generating storyboard...</span>
                    <span>75%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full animate-pulse shadow-sm" style={{ width: '75%' }}></div>
                  </div>
                </div>

                {/* AI Indicators */}
                <div className="mt-4 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 lg:flex-1 flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link 
                to="/"
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                }}
              >
                Scripto
              </Link>
            </div>

            {/* Render different components based on auth mode */}
            {authMode === 'forgot' ? (
              <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-xl p-8 border border-neutral-200">
                <PasswordResetRequest onBackToLogin={handleBackToLogin} />
              </div>
            ) : authMode === 'reset' ? (
              <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-xl p-8 border border-neutral-200">
                <PasswordReset />
              </div>
            ) : (
              <AuthForm
                onLogin={handleLogin}
                onRegister={handleRegister}
                onForgotPassword={handleForgotPassword}
                isLoading={isLoading}
                error={error}
                onClearError={clearError}
              />
            )}
            
            {/* Back to Home Link */}
            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
