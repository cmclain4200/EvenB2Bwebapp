// Even B2B – Shared design tokens (Web)
// These values match the CSS custom properties in globals.css.
// Use Tailwind classes (e.g. bg-primary, text-text) when possible.
// Import these only when you need values in JS (e.g. charts, dynamic styles).

export const colors = {
  bg: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  primary: '#1F3A5F',
  primaryHover: '#274B7A',
  primarySoft: '#E6EEF7',
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
  sans: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"SF Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace',
} as const;
