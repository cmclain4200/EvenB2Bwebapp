// Approcure – Shared design tokens (Web)
// These values match the CSS custom properties in globals.css.
// Use Tailwind classes (e.g. bg-primary, text-text) when possible.
// Import these only when you need values in JS (e.g. charts, dynamic styles).

export const colors = {
  bg: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  primary: '#ff5a00',
  primaryHover: '#e64f00',
  primarySoft: '#FFF1E8',
  success: '#1E7F4F',
  successSoft: '#E9F5EF',
  warning: '#C47A00',
  warningSoft: '#FFF7E6',
  danger: '#C0362C',
  dangerSoft: '#FDECEC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const fontFamily = {
  sans: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
  mono: '"IBM Plex Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace',
} as const;
