import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Menu, X } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import UserMenu from '../common/UserMenu';
import AuthButtons from '../common/AuthButtons';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  projectName: string;
  navigation?: NavItem[];
  showBackToMain?: boolean;
  customActions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  projectName, 
  navigation = [],
  showBackToMain = true,
  customActions
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthContext();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Left side - Project name */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center">
              <Link 
                to="/"
                className="text-base sm:text-lg md:text-xl font-semibold bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                }}
              >
                {projectName}
              </Link>
            </div>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
            {navigation.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="text-xs sm:text-sm md:text-base text-neutral-600 hover:text-neutral-900 transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Auth and Custom Actions */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* Custom Actions */}
            {customActions && (
              <div className="hidden sm:block">
                {customActions}
              </div>
            )}

            {/* Authentication Section */}
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <UserMenu />
              ) : (
                <AuthButtons />
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Mobile menu */}
          <div className="md:hidden bg-white border-b border-neutral-200 shadow-lg relative z-50">
            <div className="px-4 py-4 space-y-4">
              {/* Authentication Section for mobile */}
              <div className="pb-4 border-b border-neutral-100">
                {isAuthenticated && user ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-sm text-neutral-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AuthButtons className="w-full justify-center" />
                )}
              </div>
              
              {/* Custom Actions for mobile */}
              {customActions && (
                <div className="py-3 border-b border-neutral-100">
                  {customActions}
                </div>
              )}
              
              {/* Mobile Navigation */}
              {navigation.length > 0 && (
                <nav className="space-y-1">
                  {navigation.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm sm:text-base md:text-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all duration-200 font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
              
              {/* User Menu Items for mobile (if authenticated) */}
              {isAuthenticated && user && (
                <nav className="space-y-1 pt-2 border-t border-neutral-100">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all duration-200"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/my-stories"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all duration-200"
                  >
                    My Stories
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all duration-200"
                  >
                    Settings
                  </Link>
                </nav>
              )}
              
              {/* Show message if no navigation items and not authenticated */}
              {navigation.length === 0 && !isAuthenticated && (
                <div className="text-center py-4 text-neutral-500">
                  No navigation items
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
