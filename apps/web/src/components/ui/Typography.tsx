import React from 'react';
import { typography, lineHeight, fontWeight } from '../../lib/typography';

interface TypographyProps {
  variant: keyof typeof typography;
  size: string;
  children: React.ReactNode;
  className?: string;
  weight?: keyof typeof fontWeight;
  leading?: keyof typeof lineHeight;
  as?: React.ElementType;
}

/**
 * Typography component with responsive text sizing
 * 
 * Usage examples:
 * <Typography variant="heading" size="lg">Large Heading</Typography>
 * <Typography variant="body" size="md">Body text</Typography>
 * <Typography variant="display" size="sm">Display text</Typography>
 */
const Typography: React.FC<TypographyProps> = ({
  variant,
  size,
  children,
  className = '',
  weight = 'normal',
  leading = 'normal',
  as: Component = 'p'
}) => {
  // Get the responsive text classes
  const textClasses = typography[variant]?.[size as keyof typeof typography[typeof variant]];
  
  if (!textClasses) {
    console.warn(`Typography: Invalid variant "${variant}" or size "${size}"`);
    return null;
  }

  const classes = [
    textClasses,
    fontWeight[weight],
    lineHeight[leading],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

export default Typography;
