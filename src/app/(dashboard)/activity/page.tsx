'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/data/store';
import { AuditEntry } from '@/data/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';

type ActionFilter = 'all' | 'submitted' | 'approved' | 'rejected' | 'purchased';

const ACTION_FILTERS: { key: ActionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'purchased', label: 'Purchased' },
];

const ACTION_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  created: { bg: 'bg-surface', text: 'text-text-muted', dot: 'bg-text-muted' },
  submitted: { bg: 'bg-blue-light', text: 'text-blue', dot: 'bg-blue' },
  approved: { bg: 'bg-primary-soft', text: 'text-primary', dot: 'bg-primary' },
  rejected: { bg: 'bg-danger-soft', text: 'text-danger', dot: 'bg-danger' },
  purchased: { bg: 'bg-success-soft', text: 'text-success', dot: 'bg-success' },
  updated: { bg: 'bg-surface', text: 'text-text-muted', dot: 'bg-text-muted' },
};

export default function ActivityPage() {
  const store = useStore();
  const [filter, setFilter] = useState<ActionFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = filter === 'all'
      ? [...store.auditLog]
      : store.auditLog.filter((e) => e.action === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.details?.toLowerCase().includes(q)) ||
          (store.getUserById(e.userId)?.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [store, filter, search]);

  // Summary stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const todayEntries = store.auditLog.filter((e) => new Date(e.timestamp) >= today);
    const weekEntries = store.auditLog.filter((e) => new Date(e.timestamp) >= thisWeek);

    return {
      today: todayEntries.length,
      thisWeek: weekEntries.length,
      total: store.auditLog.length,
      approvedThisWeek: weekEntries.filter((e) => e.action === 'approved').length,
      rejectedThisWeek: weekEntries.filter((e) => e.action === 'rejected').length,
    };
  }, [store.auditLog]);

  const handleExport = () => {
    const csv = [
      'Timestamp,Action,User,Details',
      ...filtered.map((e) => {
        const user = store.getUserById(e.userId);
        return `"${formatDate(e.timestamp)}","${e.action}","${user?.name ?? ''}","${e.details ?? ''}"`;
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Today" value={stats.today} />
        <StatCard label="This Week" value={stats.thisWeek} />
        <StatCard label="Approved (7d)" value={stats.approvedThisWeek} color="text-primary" />
        <StatCard label="Rejected (7d)" value={stats.rejectedThisWeek} color="text-danger" />
        <StatCard label="Total Events" value={stats.total} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] border border-border rounded bg-bg text-text placeholder:text-text-muted w-56 focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-[12px] font-medium text-text-muted border border-border rounded hover:text-text hover:bg-surface transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px] w-32">Time</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px] w-24">Action</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px] w-36">User</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-text-muted text-sm">
                  No activity found.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <p className="text-[11px] text-text-muted text-right">
        Showing {filtered.length} of {store.auditLog.length} events
      </p>
    </div>
  );
}

// ── Components ─────────────────────────────────
function ActivityRow({ entry }: { entry: AuditEntry }) {
  const store = useStore();
  const user = store.getUserById(entry.userId);
  const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.created;

  return (
    <tr className="border-b border-border-light hover:bg-surface/50">
      <td className="px-4 py-2.5">
        <span className="text-text-muted" title={formatDate(entry.timestamp)}>
          {formatRelativeTime(entry.timestamp)}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}>
          <span className={`w-1 h-1 rounded-full ${style.dot}`} />
          {entry.action}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="font-medium text-text">{user?.name ?? '—'}</span>
        {user && (
          <span className="text-[10px] text-text-muted ml-1.5 capitalize">{user.role}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-text-muted max-w-md truncate">
        {entry.details}
      </td>
    </tr>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white border border-border rounded p-3">
      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-semibold tabular-nums mt-0.5 ${color ?? 'text-text'}`}>{value}</p>
    </div>
  );
}
