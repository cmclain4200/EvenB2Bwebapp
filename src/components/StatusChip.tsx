'use client';

import { RequestStatus, UrgencyLevel } from '@/lib/data-store';

const STATUS_STYLES: Record<RequestStatus, string> = {
  draft: 'bg-surface text-text-muted',
  pending: 'bg-warning-soft text-warning',
  approved: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
  purchased: 'bg-primary-soft text-primary',
};

const STATUS_DOT: Record<RequestStatus, string> = {
  draft: 'bg-text-muted',
  pending: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-danger',
  purchased: 'bg-primary',
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  purchased: 'Purchased',
};

export function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function UrgencyChip({ urgency }: { urgency: UrgencyLevel }) {
  if (urgency === 'normal') return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold border border-danger/20 text-danger bg-danger-soft">
      Urgent
    </span>
  );
}
