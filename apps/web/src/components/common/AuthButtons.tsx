import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface AuthButtonsProps {
  className?: string;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ className = '' }) => {
  const location = useLocation();
  
  return (
    <div className={`flex items-center ${className}`}>
      <Link
        to="/auth"
        state={{ from: location }}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <LogIn className="w-4 h-4 mr-1.5" />
        <span>Sign In</span>
      </Link>
    </div>
  );
};

export default AuthButtons;
