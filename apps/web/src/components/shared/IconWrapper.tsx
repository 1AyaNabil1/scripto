import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  background?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  animate?: boolean;
}

const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 'md',
  color = 'text-blue-600',
  background = 'bg-blue-100',
  rounded = 'xl',
  className = '',
  animate = true
}) => {
  const sizeClasses = {
    sm: { wrapper: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { wrapper: 'w-12 h-12', icon: 'w-6 h-6' },
    lg: { wrapper: 'w-16 h-16', icon: 'w-8 h-8' },
    xl: { wrapper: 'w-20 h-20', icon: 'w-10 h-10' }
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };

  const wrapperClasses = `
    inline-flex items-center justify-center
    ${sizeClasses[size].wrapper}
    ${background}
    ${roundedClasses[rounded]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (animate) {
    return (
      <motion.div
        className={wrapperClasses}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className={`${sizeClasses[size].icon} ${color}`} />
      </motion.div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <Icon className={`${sizeClasses[size].icon} ${color}`} />
    </div>
  );
};

export default IconWrapper;
