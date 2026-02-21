'use client';

import { useState } from 'react';
import { useDataStore } from '@/lib/data-store';
import { StatusChip } from '@/components/StatusChip';
import { formatCurrency, formatCurrencyCompact, PHASE_LABELS, CATEGORY_LABELS } from '@/lib/utils';

export default function ProjectsPage() {
  const store = useDataStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {store.projects.map((project) => {
          const snap = store.getBudgetSnapshot(project.id);
          const pct = snap.monthlyBudget > 0
            ? Math.round((snap.approvedTotal / snap.monthlyBudget) * 100)
            : 0;
          const isOver = pct >= 100;
          const isAtRisk = pct >= 80 && !isOver;

          return (
            <button
              key={project.id}
              onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
              className={`text-left bg-white border rounded-xl p-4 transition-colors ${
                expandedId === project.id
                  ? 'border-primary ring-1 ring-primary/20'
                  : 'border-border hover:border-text-muted/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-text">{project.name}</h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">{project.jobNumber}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  project.status === 'active'
                    ? 'bg-success-soft text-success'
                    : project.status === 'on-hold'
                    ? 'bg-warning-soft text-warning'
                    : 'bg-surface text-text-muted'
                }`}>
                  {project.status}
                </span>
              </div>

              {/* Phase */}
              <div className="mb-3">
                <PhaseBar phase={project.phase} />
              </div>

              {/* Budget bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-muted">Budget utilization</span>
                  <span className={`text-[11px] tabular-nums font-semibold ${
                    isOver ? 'text-danger' : isAtRisk ? 'text-warning' : 'text-text'
                  }`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-surface rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all ${isOver ? 'bg-danger' : isAtRisk ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Budget numbers */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-text-muted block">Monthly</span>
                  <span className="font-medium text-text tabular-nums">{formatCurrencyCompact(snap.monthlyBudget)}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Committed</span>
                  <span className="font-medium text-text tabular-nums">{formatCurrencyCompact(snap.approvedTotal)}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Remaining</span>
                  <span className={`font-medium tabular-nums ${snap.remaining < 0 ? 'text-danger' : 'text-text'}`}>
                    {formatCurrencyCompact(snap.remaining)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded project detail */}
      {expandedId && <ProjectDetail projectId={expandedId} />}

      {/* All projects table (when none expanded) */}
      {!expandedId && <AllProjectsOverview />}
    </div>
  );
}

// ── Project Detail ─────────────────────────────
function ProjectDetail({ projectId }: { projectId: string }) {
  const store = useDataStore();
  const project = store.getProjectById(projectId);
  const snap = store.getBudgetSnapshot(projectId);
  const requests = store.requests
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!project) return null;

  // Group by cost code
  const byCostCode: Record<string, { code: string; label: string; total: number; count: number }> = {};
  for (const r of requests) {
    const cc = store.getCostCodeById(r.costCodeId);
    if (!cc) continue;
    if (!byCostCode[cc.id]) {
      byCostCode[cc.id] = { code: cc.code, label: cc.label, total: 0, count: 0 };
    }
    if (r.status !== 'rejected') {
      byCostCode[cc.id].total += r.estimatedTotal;
      byCostCode[cc.id].count += 1;
    }
  }

  // Threshold marker
  const thresholds = [
    { label: 'Manager', limit: 5000 },
    { label: 'Admin', limit: 25000 },
  ];

  return (
    <div className="bg-white border border-border rounded-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-text">{project.name}</h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            {project.jobNumber} · {project.address} · {PHASE_LABELS[project.phase]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-muted">Monthly Budget</p>
          <p className="text-[15px] font-semibold text-text tabular-nums">{formatCurrency(snap.monthlyBudget)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Cost code breakdown */}
        <div className="p-6">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Spend by Cost Code</h3>
          <div className="space-y-2">
            {Object.values(byCostCode)
              .sort((a, b) => b.total - a.total)
              .map((entry) => {
                const pct = snap.monthlyBudget > 0 ? (entry.total / snap.monthlyBudget) * 100 : 0;
                return (
                  <div key={entry.code} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-text-muted w-16 shrink-0">{entry.code}</span>
                    <div className="flex-1">
                      <div className="h-1.5 bg-surface rounded-sm overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-sm" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-text tabular-nums w-16 text-right">
                      {formatCurrencyCompact(entry.total)}
                    </span>
                    <span className="text-[10px] text-text-muted w-10 text-right">{entry.count} PO{entry.count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
          </div>

          {/* Approval thresholds */}
          <div className="mt-6">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Approval Thresholds</h3>
            <div className="flex items-center gap-4">
              {thresholds.map((t) => (
                <div key={t.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-text-muted/40" />
                  <span className="text-[11px] text-text-muted">{t.label}: up to {formatCurrencyCompact(t.limit)}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[11px] text-text-muted">Admin: unlimited</span>
              </div>
            </div>
          </div>
        </div>

        {/* PO history */}
        <div className="p-6">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Recent POs</h3>
          <div className="space-y-0">
            {requests.map((r) => {
              const requester = store.getUserById(r.requesterId);
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-border-light last:border-0">
                  <span className="font-mono text-[11px] text-text-muted w-16 shrink-0">{r.poNumber}</span>
                  <span className="text-[12px] text-text flex-1 truncate">{r.vendor}</span>
                  <span className="text-[11px] font-medium text-text tabular-nums">{formatCurrency(r.estimatedTotal)}</span>
                  <StatusChip status={r.status} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── All Projects Overview Table ────────────────
function AllProjectsOverview() {
  const store = useDataStore();

  return (
    <div className="bg-bg border border-border rounded">
      <div className="px-6 py-3 border-b border-border">
        <h2 className="text-[12px] font-semibold text-muted uppercase tracking-wider">All Projects</h2>
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left px-6 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Project</th>
            <th className="text-left px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Phase</th>
            <th className="text-right px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Budget</th>
            <th className="text-right px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Committed</th>
            <th className="text-right px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Pending</th>
            <th className="text-right px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Remaining</th>
            <th className="text-left px-4 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px] w-40">Utilization</th>
            <th className="text-right px-6 py-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">POs</th>
          </tr>
        </thead>
        <tbody>
          {store.projects.map((p) => {
            const snap = store.getBudgetSnapshot(p.id);
            const pct = snap.monthlyBudget > 0 ? Math.round((snap.approvedTotal / snap.monthlyBudget) * 100) : 0;
            const isOver = pct >= 100;
            const isAtRisk = pct >= 80 && !isOver;
            const poCount = store.requests.filter((r) => r.projectId === p.id && r.status !== 'rejected').length;

            return (
              <tr key={p.id} className="border-b border-border-light hover:bg-surface/50">
                <td className="px-6 py-3">
                  <span className="font-medium text-text">{p.name}</span>
                  <span className="block text-[10px] text-muted font-mono mt-0.5">{p.jobNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-muted">{PHASE_LABELS[p.phase]}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-text">
                  {formatCurrency(snap.monthlyBudget)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text">
                  {formatCurrency(snap.approvedTotal)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-warning">
                  {snap.pendingTotal > 0 ? formatCurrency(snap.pendingTotal) : '—'}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${snap.remaining < 0 ? 'text-danger' : 'text-text'}`}>
                  {formatCurrency(snap.remaining)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${isOver ? 'bg-danger' : isAtRisk ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] tabular-nums font-medium w-8 text-right ${
                      isOver ? 'text-danger' : isAtRisk ? 'text-warning' : 'text-muted'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-muted">{poCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Phase Bar ──────────────────────────────────
const PHASES = ['preconstruction', 'foundation', 'structural', 'framing', 'mep', 'finishes', 'closeout'] as const;

function PhaseBar({ phase }: { phase: string }) {
  const idx = PHASES.indexOf(phase as typeof PHASES[number]);
  return (
    <div className="flex items-center gap-0.5">
      {PHASES.map((p, i) => (
        <div
          key={p}
          className={`h-1 flex-1 rounded-sm ${
            i <= idx ? 'bg-primary' : 'bg-surface'
          }`}
          title={PHASE_LABELS[p]}
        />
      ))}
    </div>
  );
}
