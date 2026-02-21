'use client';

import { useState, useMemo } from 'react';
import { useDataStore, PurchaseRequest, RequestStatus } from '@/lib/data-store';
import { useAuthStore } from '@/lib/auth-store';
import { StatusChip, UrgencyChip } from '@/components/StatusChip';
import { RequestDetailDrawer } from '@/components/RequestDetailDrawer';
import { RejectModal } from '@/components/RejectModal';
import { formatCurrency, formatCurrencyCompact, NEED_BY_LABELS, PHASE_LABELS } from '@/lib/utils';

type TabFilter = 'pending' | 'approved' | 'rejected' | 'purchased' | 'all';

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'all', label: 'All' },
];

export default function QueuePage() {
  const store = useDataStore();
  const [tab, setTab] = useState<TabFilter>('pending');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PurchaseRequest | null>(null);
  const [toast, setToast] = useState<{ message: string; undoId?: string } | null>(null);

  const pendingRequests = store.getPendingRequests();
  const pendingTotal = pendingRequests.reduce((sum, r) => sum + r.estimatedTotal, 0);

  const filtered = useMemo(() => {
    let list = tab === 'all'
      ? [...store.requests]
      : store.requests.filter((r) => r.status === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.poNumber.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          (store.getProjectById(r.projectId)?.name.toLowerCase().includes(q)) ||
          (store.getProjectById(r.projectId)?.jobNumber.toLowerCase().includes(q)) ||
          (store.getCostCodeById(r.costCodeId)?.code.toLowerCase().includes(q))
      );
    }

    // Sort: urgent first, then by date
    return list.sort((a, b) => {
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [store, tab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: store.requests.length };
    for (const r of store.requests) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return counts;
  }, [store.requests]);

  const handleApprove = async (r: PurchaseRequest) => {
    try {
      await store.approveRequest(r.id);
      showToast(`${r.poNumber} approved`, r.id);
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await store.rejectRequest(rejectTarget.id, reason);
      showToast(`${rejectTarget.poNumber} rejected`);
    } catch (err) {
      showToast((err as Error).message);
    }
    setRejectTarget(null);
  };

  const showToast = (message: string, undoId?: string) => {
    setToast({ message, undoId });
    setTimeout(() => setToast(null), 4000);
  };

  // Budget health for bottom strip
  const projectSnapshots = store.projects.map((p) => ({
    project: p,
    snapshot: store.getBudgetSnapshot(p.id),
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Action bar */}
      <div className="px-8 py-4 border-b border-border bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {TABS.map((t) => {
                const count = tabCounts[t.key] || 0;
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    }`}
                  >
                    {t.label}
                    <span className={`ml-1.5 ${isActive ? 'text-white/60' : 'text-text-muted'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search PO, vendor, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] border border-border rounded bg-white text-text placeholder:text-text-muted/50 w-64 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px] w-8"></th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">PO #</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Vendor</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Project</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Cost Code</th>
              <th className="text-right px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Amount</th>
              {tab === 'pending' && (
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Budget Impact</th>
              )}
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Need By</th>
              <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
              {tab === 'pending' && (
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-text-muted text-sm">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <QueueRow
                  key={r.id}
                  request={r}
                  showBudgetImpact={tab === 'pending'}
                  showActions={tab === 'pending'}
                  onClick={() => setSelectedRequest(r)}
                  onApprove={() => handleApprove(r)}
                  onReject={() => setRejectTarget(r)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Budget health strip */}
      <div className="shrink-0 border-t border-border bg-white px-8 py-3">
        <div className="flex items-center gap-8">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider shrink-0">Budget</span>
          {projectSnapshots.map(({ project, snapshot }) => {
            const pct = snapshot.monthlyBudget > 0
              ? Math.round((snapshot.approvedTotal / snapshot.monthlyBudget) * 100)
              : 0;
            const pendingPct = snapshot.monthlyBudget > 0
              ? Math.round((snapshot.pendingTotal / snapshot.monthlyBudget) * 100)
              : 0;
            const isOver = pct >= 100;
            const isAtRisk = pct >= 80 && !isOver;
            return (
              <div key={project.id} className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-text truncate">{project.jobNumber}</span>
                  <span className={`text-[11px] tabular-nums font-medium ${
                    isOver ? 'text-danger' : isAtRisk ? 'text-warning' : 'text-text'
                  }`}>
                    {pct}%{pendingPct > 0 && <span className="text-text-muted"> +{pendingPct}%p</span>}
                  </span>
                </div>
                <div className="h-1.5 bg-surface rounded-sm overflow-hidden flex">
                  <div
                    className={`h-full ${isOver ? 'bg-danger' : isAtRisk ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                  {pendingPct > 0 && (
                    <div
                      className="h-full bg-warning/40"
                      style={{ width: `${Math.min(pendingPct, 100 - Math.min(pct, 100))}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-text-muted">{PHASE_LABELS[project.phase]}</span>
                  <span className="text-[10px] text-text-muted tabular-nums">
                    {formatCurrencyCompact(snapshot.remaining)} left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedRequest && (
        <RequestDetailDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={(r) => {
            handleApprove(r);
            setSelectedRequest(null);
          }}
          onReject={(r) => {
            setRejectTarget(r);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          poNumber={rejectTarget.poNumber}
          onReject={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-[12px] font-medium px-4 py-2.5 rounded shadow-lg flex items-center gap-3">
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Row Component ──────────────────────────────
function QueueRow({
  request,
  showBudgetImpact,
  showActions,
  onClick,
  onApprove,
  onReject,
}: {
  request: PurchaseRequest;
  showBudgetImpact: boolean;
  showActions: boolean;
  onClick: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const store = useDataStore();
  const { can } = useAuthStore();
  const project = store.getProjectById(request.projectId);
  const costCode = store.getCostCodeById(request.costCodeId);
  const vendorCount = store.getVendorPOCount(request.vendor);
  const canApprove = can('proposal.approve', request.projectId) || can('request.approve', request.projectId);
  const impact = showBudgetImpact
    ? store.getBudgetImpact(request.projectId, request.estimatedTotal)
    : null;

  return (
    <tr
      onClick={onClick}
      className="border-b border-border-light hover:bg-surface/60 cursor-pointer transition-colors group"
    >
      {/* Urgency indicator */}
      <td className="px-0 py-0 w-8">
        {request.urgency === 'urgent' && (
          <div className="w-1 h-full min-h-[44px] bg-danger rounded-r" />
        )}
      </td>

      {/* PO # */}
      <td className="px-4 py-3">
        <span className="font-mono font-medium text-text">{request.poNumber}</span>
      </td>

      {/* Vendor */}
      <td className="px-4 py-3">
        <span className="font-medium text-text">{request.vendor}</span>
        {vendorCount >= 2 && (
          <span className="block text-[10px] text-warning font-medium mt-0.5">
            {vendorCount} POs this month
          </span>
        )}
      </td>

      {/* Project */}
      <td className="px-4 py-3">
        <span className="text-text">{project?.name}</span>
        <span className="block text-[10px] text-text-muted font-mono mt-0.5">{project?.jobNumber}</span>
      </td>

      {/* Cost Code */}
      <td className="px-4 py-3">
        <span className="font-mono text-text-muted">{costCode?.code}</span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right">
        <span className="font-medium text-text tabular-nums">{formatCurrency(request.estimatedTotal)}</span>
      </td>

      {/* Budget Impact */}
      {showBudgetImpact && impact && (
        <td className="px-4 py-3 text-right">
          <span className={`tabular-nums text-[11px] font-medium ${
            impact.overBudget ? 'text-danger' : impact.atRisk ? 'text-warning' : 'text-text-muted'
          }`}>
            {impact.currentPct}%
            <span className="mx-0.5">→</span>
            {impact.afterPct}%
          </span>
        </td>
      )}

      {/* Need By */}
      <td className="px-4 py-3">
        <span className={`text-[11px] font-medium ${
          request.needBy === 'today' ? 'text-danger' : request.needBy === 'tomorrow' ? 'text-warning' : 'text-text-muted'
        }`}>
          {NEED_BY_LABELS[request.needBy]}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusChip status={request.status} />
      </td>

      {/* Actions */}
      {showActions && (
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onReject(); }}
              className="px-2.5 py-1 text-[11px] font-medium text-danger border border-danger/20 rounded hover:bg-danger-soft transition-colors"
            >
              Reject
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (canApprove) onApprove(); }}
              disabled={!canApprove}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                canApprove
                  ? 'text-white bg-primary hover:bg-primary-hover'
                  : 'text-text-muted bg-surface cursor-not-allowed'
              }`}
              title={!canApprove ? 'You do not have approval permission for this project' : undefined}
            >
              Approve
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// ── Icons ──────────────────────────────────────
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
