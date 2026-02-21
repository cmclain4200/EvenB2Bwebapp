import { NeedBy, RequestCategory, ProjectPhase } from '@/lib/data-store';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const NEED_BY_LABELS: Record<NeedBy, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  'this-week': 'This Week',
  'next-week': 'Next Week',
};

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  materials: 'Materials',
  tools: 'Tools',
  'equipment-rental': 'Equipment Rental',
  subcontract: 'Subcontract',
  other: 'Other',
};

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  preconstruction: 'Preconstruction',
  foundation: 'Foundation',
  structural: 'Structural',
  framing: 'Framing',
  mep: 'MEP',
  finishes: 'Finishes',
  closeout: 'Closeout',
};
