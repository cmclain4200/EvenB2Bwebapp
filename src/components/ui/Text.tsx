import { type HTMLAttributes } from 'react';

type Variant = 'title' | 'subtitle' | 'body' | 'muted' | 'label' | 'caption';

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'label';
}

const styles: Record<Variant, string> = {
  title: 'text-[20px] font-semibold text-text leading-tight',
  subtitle: 'text-[16px] font-semibold text-text leading-snug',
  body: 'text-[14px] text-text leading-relaxed',
  muted: 'text-[13px] text-text-muted leading-normal',
  label: 'text-[12px] font-semibold text-text-muted uppercase tracking-wider',
  caption: 'text-[11px] text-text-muted leading-normal',
};

const defaultTag: Record<Variant, TextProps['as']> = {
  title: 'h2',
  subtitle: 'h3',
  body: 'p',
  muted: 'p',
  label: 'span',
  caption: 'span',
};

export function Text({ variant = 'body', as, className = '', ...props }: TextProps) {
  const Tag = as || defaultTag[variant] || 'p';
  return <Tag className={`${styles[variant]} ${className}`} {...props} />;
}
