import { type HTMLAttributes } from 'react';

interface ScreenLayoutProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'md' | 'lg' | 'xl' | 'full';
}

const widths = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: '',
};

export function ScreenLayout({ maxWidth = 'full', className = '', ...props }: ScreenLayoutProps) {
  return (
    <div
      className={`px-8 py-6 ${widths[maxWidth]} ${className}`}
      {...props}
    />
  );
}
