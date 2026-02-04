import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui';
import type { ArrowRight } from 'lucide-react';

interface AuthAwareButtonProps {
  to: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: typeof ArrowRight;
  iconPosition?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

export const AuthAwareButton: React.FC<AuthAwareButtonProps> = ({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition,
  className,
  children,
}) => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated && to === '/try-app') {
      e.preventDefault();
      navigate('/auth');
    }
  };

  return (
    <Link to={to} onClick={handleClick}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        iconPosition={iconPosition}
        className={className}
      >
        {children}
      </Button>
    </Link>
  );
};
