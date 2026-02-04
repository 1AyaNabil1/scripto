// Responsive Typography Utility
// Provides consistent text sizing that scales across different screen sizes

export const typography = {
  // Display text - for large hero headings
  display: {
    sm: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    md: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    lg: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
  },
  
  // Heading text - for section titles and page headers
  heading: {
    xs: 'text-xs sm:text-sm md:text-base lg:text-lg',
    sm: 'text-sm sm:text-base md:text-lg lg:text-xl',
    md: 'text-base sm:text-lg md:text-xl lg:text-2xl',
    lg: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    xl: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
  },
  
  // Body text - for paragraphs and general content
  body: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl'
  },
  
  // Caption and small text
  caption: {
    xs: 'text-xs',
    sm: 'text-xs sm:text-sm',
    md: 'text-sm'
  },
  
  // Button text
  button: {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  },
  
  // Lead text - for emphasis/intro paragraphs
  lead: {
    sm: 'text-sm sm:text-base md:text-lg',
    md: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl'
  }
} as const;

export type TypographyVariant = keyof typeof typography;
export type TypographySize<T extends TypographyVariant> = keyof typeof typography[T];

// Helper function to get typography classes
export const getTypographyClasses = <T extends TypographyVariant>(
  variant: T,
  size: keyof typeof typography[T]
): string => {
  return typography[variant][size] as string;
};

// Responsive line height utilities
export const lineHeight = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose'
} as const;

// Responsive font weight utilities
export const fontWeight = {
  light: 'font-light',
  normal: 'font-normal', 
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold'
} as const;
