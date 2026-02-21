'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const inputBase =
  'w-full h-9 px-3 text-[13px] text-text bg-white border border-border rounded-lg placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-40 disabled:bg-surface';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, className = '', id, ...props }, ref) => {
    const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={className}>
        {label && (
          <label htmlFor={fieldId} className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={`${inputBase} ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-[11px] text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={`${fieldId}-helper`} className="mt-1 text-[11px] text-text-muted">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, className = '', id, ...props }, ref) => {
    const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={className}>
        {label && (
          <label htmlFor={fieldId} className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={`w-full px-3 py-2 text-[13px] text-text bg-white border border-border rounded-lg placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none disabled:opacity-40 ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1 text-[11px] text-danger" role="alert">{error}</p>}
        {!error && helper && <p className="mt-1 text-[11px] text-text-muted">{helper}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
