'use client';

import { useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDataStore } from '@/lib/data-store';
import type { PurchaseRequest, Project } from '@/lib/data-store';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const requests = useDataStore((s) => s.requests);
  const projects = useDataStore((s) => s.projects);
  const users = useDataStore((s) => s.users);
  const auditLog = useDataStore((s) => s.auditLog);
  const getBudgetSnapshot = useDataStore((s) => s.getBudgetSnapshot);

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === 'approved'), [requests]);
  const purchased = useMemo(() => requests.filter((r) => r.status === 'purchased'), [requests]);

  const pendingTotal = pending.reduce((s, r) => s + r.estimatedTotal, 0);
  const approvedTotal = approved.reduce((s, r) => s + r.estimatedTotal, 0);
  const purchasedTotal = purchased.reduce((s, r) => s + (r.finalTotal ?? r.estimatedTotal), 0);

  const recentActivity = useMemo(() => auditLog.slice(0, 3), [auditLog]);

  const topPending = useMemo(
    () =>
      [...pending]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [pending]
  );

  const getUser = (id: string) => users.find((u) => u.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="p-8">
      {/* Transactions */}
      <h2 className="text-[18px] font-semibold text-text mb-5">Transactions</h2>

      {/* Stat Cards + Recent Activity */}
      <div className="flex gap-4 mb-6">
        {/* Stat Cards */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* Pending Approval */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[13px] font-medium text-text">Pending Approval</span>
              </div>
              <button className="text-text-muted/30 hover:text-text-muted">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-[28px] font-bold text-text leading-tight">{pending.length}</div>
            <div className="text-[12px] text-text-muted mt-1">{formatCurrency(pendingTotal)} total value</div>
          </div>

          {/* Approved */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-text">Approved</span>
              </div>
              <button className="text-text-muted/30 hover:text-text-muted">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-[28px] font-bold text-text leading-tight">{approved.length}</div>
            <div className="text-[12px] text-text-muted mt-1">{formatCurrency(approvedTotal)} committed</div>
          </div>

          {/* Purchased */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center text-primary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-text">Purchased</span>
              </div>
              <button className="text-text-muted/30 hover:text-text-muted">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="text-[28px] font-bold text-text leading-tight">{purchased.length}</div>
            <div className="text-[12px] text-text-muted mt-1">{formatCurrency(purchasedTotal)} spent</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="w-[280px] bg-white rounded-xl border border-border p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-text">Recent Activity</h3>
            <button className="text-text-muted/30 hover:text-text-muted">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {recentActivity.map((entry) => {
              const user = getUser(entry.userId);
              const request = requests.find((r) => r.id === entry.requestId);
              const initials = user?.name.split(' ').map((n) => n[0]).join('') ?? '??';
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-white">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-text">{user?.name}</p>
                    <p className="text-[11px] text-text-muted truncate">
                      {request?.poNumber} &middot; {request?.vendor}
                    </p>
                    <p className="text-[11px] text-text-muted/60">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 bg-surface text-text-muted">
                    {entry.action}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <Link href="/activity" className="text-[12px] text-text-muted hover:text-primary transition-colors">
              View all
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-text">Pending Requests</h3>
          <Link href="/queue" className="text-[13px] font-medium text-primary hover:text-primary-hover transition-colors">
            View All &gt;
          </Link>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="text-left pb-3 pl-2">Submitted</th>
              <th className="text-left pb-3">PO #</th>
              <th className="text-left pb-3">Vendor</th>
              <th className="text-left pb-3">Project</th>
              <th className="text-left pb-3">Amount</th>
              <th className="text-left pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {topPending.map((req) => {
              const project = getProject(req.projectId);
              return (
                <tr key={req.id} className="border-t border-border-light">
                  <td className="py-3.5 pl-2 text-[13px] text-text-muted">
                    {formatRelativeTime(req.createdAt)}
                  </td>
                  <td className="py-3.5 text-[13px] text-text font-medium">{req.poNumber}</td>
                  <td className="py-3.5 text-[13px] text-text">{req.vendor}</td>
                  <td className="py-3.5 text-[13px] text-text">{project?.name}</td>
                  <td className="py-3.5 text-[13px] text-text">{formatCurrency(req.estimatedTotal)}</td>
                  <td className="py-3.5">
                    {req.urgency === 'urgent' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-danger text-white">
                        Urgent
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {topPending.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[13px] text-text-muted">
                  No pending requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Budget Overview */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-text">Budget Overview</h3>
          <Link href="/projects" className="text-[13px] font-medium text-primary hover:text-primary-hover transition-colors">
            Full details &gt;
          </Link>
        </div>

        <div className="space-y-5">
          {projects.map((project) => {
            const snapshot = getBudgetSnapshot(project.id);
            const spent = snapshot.approvedTotal + snapshot.purchasedTotal;
            const pct = snapshot.monthlyBudget > 0 ? Math.round((spent / snapshot.monthlyBudget) * 100) : 0;
            const isOnTrack = pct < 80;

            return (
              <div key={project.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-text">{project.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isOnTrack
                        ? 'bg-success-soft text-success'
                        : 'bg-danger-soft text-danger'
                    }`}>
                      {isOnTrack ? 'On Track' : 'At Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px]">
                    <span className="text-text">
                      {formatCurrency(spent)} / {formatCurrency(snapshot.monthlyBudget)}
                    </span>
                    <span className="text-text-muted">{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-surface rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-primary"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Health Overview */}
      <FinancialHealthSection projects={projects} requests={requests} getBudgetSnapshot={getBudgetSnapshot} />
    </div>
  );
}

// ── Financial Health Section ────────────────────────────────

interface BudgetSnapshot {
  monthlyBudget: number;
  approvedTotal: number;
  purchasedTotal: number;
  pendingTotal: number;
}

function FinancialHealthSection({
  projects,
  requests,
  getBudgetSnapshot,
}: {
  projects: Project[];
  requests: PurchaseRequest[];
  getBudgetSnapshot: (projectId: string) => BudgetSnapshot;
}) {
  const projectData = useMemo(
    () =>
      projects.map((p) => {
        const snap = getBudgetSnapshot(p.id);
        return {
          name: p.name,
          budget: snap.monthlyBudget,
          committed: snap.approvedTotal + snap.purchasedTotal,
          actual: snap.purchasedTotal,
        };
      }),
    [projects, getBudgetSnapshot]
  );

  const spendData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);

    const approvedByDate: Record<string, number> = {};
    const purchasedByDate: Record<string, number> = {};

    for (const r of requests) {
      if (r.approvedAt) {
        const d = new Date(r.approvedAt);
        if (d >= cutoff) {
          const key = d.toISOString().slice(0, 10);
          approvedByDate[key] = (approvedByDate[key] ?? 0) + r.estimatedTotal;
        }
      }
      if (r.purchasedAt) {
        const d = new Date(r.purchasedAt);
        if (d >= cutoff) {
          const key = d.toISOString().slice(0, 10);
          purchasedByDate[key] = (purchasedByDate[key] ?? 0) + (r.finalTotal ?? r.estimatedTotal);
        }
      }
    }

    // Build 60-day date range
    const dates: string[] = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    let cumApproved = 0;
    let cumPurchased = 0;
    return dates.map((date) => {
      cumApproved += approvedByDate[date] ?? 0;
      cumPurchased += purchasedByDate[date] ?? 0;
      return { date, approved: cumApproved, purchased: cumPurchased };
    });
  }, [requests]);

  return (
    <div>
      <h2 className="text-[16px] font-semibold text-text mb-1">Financial Health Overview</h2>
      <p className="text-[12px] text-text-muted mb-5">
        Budget utilization and spend trends across all active projects
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Budget vs Committed vs Actual */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-[13px] font-semibold text-text mb-5">Budget vs Committed vs Actual</h3>
          <div className="space-y-4">
            {projectData.map((p) => (
              <BudgetBar key={p.name} {...p} />
            ))}
          </div>
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border-light">
            <LegendDot color="bg-primary" label="Actual Spent" />
            <LegendDot color="bg-success/40" label="Committed" />
            <LegendDot color="bg-surface" label="Remaining" />
          </div>
        </div>

        {/* Spend Over Time */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-[13px] font-semibold text-text mb-5">Spend Trend – Last 60 Days</h3>
          <SpendChart data={spendData} />
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border-light">
            <LegendDot color="bg-primary" label="Approved (cumulative)" />
            <LegendDot color="bg-success" label="Purchased (cumulative)" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Budget Bar ──────────────────────────────────────────────

function BudgetBar({
  name,
  budget,
  committed,
  actual,
}: {
  name: string;
  budget: number;
  committed: number;
  actual: number;
}) {
  const pctActual = budget > 0 ? (actual / budget) * 100 : 0;
  const pctCommitted = budget > 0 ? (committed / budget) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-text">{name}</span>
        <span className="text-[11px] text-text-muted tabular-nums">{formatCurrency(budget)}</span>
      </div>
      <div className="w-full bg-surface rounded-full h-3 relative overflow-hidden">
        {/* Committed (behind actual) */}
        <div
          className="absolute top-0 left-0 h-3 rounded-full bg-success/40 transition-all"
          style={{ width: `${Math.min(pctCommitted, 100)}%` }}
        />
        {/* Actual (on top) */}
        <div
          className="absolute top-0 left-0 h-3 rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(pctActual, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-text-muted tabular-nums">
          Actual: {formatCurrency(actual)}
        </span>
        <span className="text-[10px] text-text-muted tabular-nums">
          Committed: {formatCurrency(committed)}
        </span>
        <span className="text-[10px] text-text-muted tabular-nums">
          Remaining: {formatCurrency(Math.max(budget - committed, 0))}
        </span>
      </div>
    </div>
  );
}

// ── Spend Chart (canvas-based) ──────────────────────────────

function SpendChart({ data }: { data: { date: string; approved: number; purchased: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padTop = 8;
    const padBottom = 24;
    const padLeft = 48;
    const padRight = 12;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.approved, d.purchased)),
      1
    );
    const niceMax = Math.ceil(maxVal / 1000) * 1000;

    // Y-axis grid lines
    const ySteps = 4;
    ctx.strokeStyle = '#F0F1F3';
    ctx.lineWidth = 1;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'right';

    for (let i = 0; i <= ySteps; i++) {
      const val = (niceMax / ySteps) * i;
      const y = padTop + chartH - (val / niceMax) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();
      ctx.fillText(`$${(val / 1000).toFixed(0)}k`, padLeft - 6, y + 3);
    }

    // X-axis labels (show ~5 dates)
    ctx.textAlign = 'center';
    const labelInterval = Math.floor(data.length / 5);
    for (let i = 0; i < data.length; i += labelInterval) {
      const x = padLeft + (i / (data.length - 1)) * chartW;
      const d = new Date(data[i].date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      ctx.fillText(label, x, H - 4);
    }

    // Helper to draw a line + fill
    function drawLine(
      values: number[],
      color: string,
      fillAlpha: number
    ) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = padLeft + (i / (values.length - 1)) * chartW;
        const y = padTop + chartH - (values[i] / niceMax) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill
      const lastX = padLeft + chartW;
      const baseline = padTop + chartH;
      ctx.lineTo(lastX, baseline);
      ctx.lineTo(padLeft, baseline);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', `, ${fillAlpha})`).replace('rgb', 'rgba');
      ctx.fill();
    }

    // Draw approved line (primary blue)
    drawLine(
      data.map((d) => d.approved),
      'rgb(31, 58, 95)',
      0.08
    );

    // Draw purchased line (success green)
    drawLine(
      data.map((d) => d.purchased),
      'rgb(30, 127, 79)',
      0.08
    );
  }, [data]);

  if (data.length === 0 || (data[data.length - 1].approved === 0 && data[data.length - 1].purchased === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-[13px] text-text-muted">
        No spend data in the last 60 days
      </div>
    );
  }

  return <canvas ref={canvasRef} className="w-full h-[200px]" />;
}

// ── Legend Dot ───────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}
