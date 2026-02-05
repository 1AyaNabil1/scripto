import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ChevronDown, 
  UserCircle, 
  History,
  Heart,
  BarChart3,
  Shield
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin';

  const getUsagePercentage = () => {
    if (!user) return 0;
    // Admins have unlimited usage
    if (isAdmin) return 0;
    const dailyLimit = 3; // Daily limit of 3
    return Math.min((user.dailyUsageCount / dailyLimit) * 100, 100);
  };

  const getUsageColor = () => {
    // Admins always have green status
    if (isAdmin) return 'bg-emerald-500';
    const percentage = getUsagePercentage();
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(user.name)}
          </div>
          {/* Usage indicator dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white">
            <div className={`w-full h-full rounded-full ${getUsageColor()}`} />
          </div>
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-neutral-900 truncate max-w-24">
            {user.name}
          </div>
          <div className="text-xs text-neutral-500 truncate max-w-24">
            {isAdmin ? '∞ Unlimited' : `${user.dailyUsageCount}/3 today`}
          </div>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900 truncate">
                    {user.name}
                  </div>
                  <div className="text-sm text-neutral-500 truncate">
                    {user.email}
                  </div>
                  {user.isEmailVerified && (
                    <div className="text-xs text-emerald-600 flex items-center mt-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
              
              {/* Usage Progress */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-neutral-600 mb-1">
                  <span>Daily Usage</span>
                  <span>{isAdmin ? '∞ Unlimited' : `${user.dailyUsageCount}/3`}</span>
                </div>
                {isAdmin ? (
                  <div className="text-xs text-emerald-600 font-medium">Admin - Unlimited Access</div>
                ) : (
                  <div className="w-full bg-neutral-200 rounded-full h-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getUsageColor()}`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Admin Dashboard Link - Only visible for admins */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors duration-200 font-medium"
                  >
                    <Shield className="w-4 h-4 mr-3 text-purple-600" />
                    Admin Dashboard
                  </Link>
                  <hr className="my-1 border-neutral-100" />
                </>
              )}
              
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
              >
                <UserCircle className="w-4 h-4 mr-3 text-neutral-600" />
                Profile Settings
              </Link>
              
              <Link
                to="/my-stories"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
              >
                <History className="w-4 h-4 mr-3 text-neutral-600" />
                My Stories
              </Link>
              
              <Link
                to="/liked-stories"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
              >
                <Heart className="w-4 h-4 mr-3 text-neutral-600" />
                Liked Stories
              </Link>
              
              <Link
                to="/usage-stats"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
              >
                <BarChart3 className="w-4 h-4 mr-3 text-neutral-600" />
                Usage Statistics
              </Link>
              
              <hr className="my-1 border-neutral-100" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
