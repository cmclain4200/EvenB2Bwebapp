interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-text-muted/40 mb-3">{icon}</div>}
      <p className="text-[14px] font-medium text-text">{title}</p>
      {description && <p className="text-[13px] text-text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
      <p className="text-[13px] text-text-muted">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-[14px] font-medium text-text">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-[13px] font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
