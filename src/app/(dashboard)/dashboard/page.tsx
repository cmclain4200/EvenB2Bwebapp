'use client';

import { useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDataStore } from '@/lib/data-store';
import type { PurchaseRequest, Project } from '@/lib/data-store';
import { useAuthStore } from '@/lib/auth-store';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

// ── Role detection ─────────────────────────────────────────
type DashboardVariant = 'admin' | 'approver' | 'accounting' | 'field';

function useDashboardVariant(): DashboardVariant {
  const { orgRoles, orgPermissions, projectBindings } = useAuthStore();

  const allPerms = useMemo(() => {
    const perms = new Set(orgPermissions);
    for (const b of projectBindings) {
      for (const p of b.permissions) perms.add(p);
    }
    return perms;
  }, [orgPermissions, projectBindings]);

  // Admin: org owner/admin
  if (orgRoles.includes('owner') || orgRoles.includes('org_admin')) return 'admin';
  // Accounting: has finance permissions
  if (orgRoles.includes('accounting_admin') || allPerms.has('finance.edit_proposal_coding')) return 'accounting';
  // Approver: can approve requests
  if (allPerms.has('proposal.approve') || allPerms.has('request.approve')) return 'approver';
  // Default: field worker
  return 'field';
}

export default function DashboardPage() {
  const variant = useDashboardVariant();
  const store = useDataStore();
  const auth = useAuthStore();

  const requests = store.requests;
  const projects = store.projects;
  const users = store.users;
  const auditLog = store.auditLog;
  const getBudgetSnapshot = store.getBudgetSnapshot;

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === 'approved'), [requests]);
  const purchased = useMemo(() => requests.filter((r) => r.status === 'purchased'), [requests]);
  const needsAttention = store.getNeedsAttention();

  const myRequests = useMemo(
    () => requests.filter((r) => r.requesterId === auth.user?.id),
    [requests, auth.user?.id]
  );
  const myPending = useMemo(() => myRequests.filter((r) => r.status === 'pending'), [myRequests]);
  const myApproved = useMemo(() => myRequests.filter((r) => r.status === 'approved'), [myRequests]);
  const myPurchased = useMemo(() => myRequests.filter((r) => r.status === 'purchased'), [myRequests]);

  const pendingTotal = pending.reduce((s, r) => s + r.estimatedTotal, 0);
  const approvedTotal = approved.reduce((s, r) => s + r.estimatedTotal, 0);
  const purchasedTotal = purchased.reduce((s, r) => s + (r.finalTotal ?? r.estimatedTotal), 0);

  const recentActivity = useMemo(() => auditLog.slice(0, 3), [auditLog]);

  const topPending = useMemo(
    () => [...pending].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [pending]
  );

  const getUser = (id: string) => users.find((u) => u.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="p-8">
      {/* Variant badge */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold text-text">
          {variant === 'field' ? 'My Requests' : variant === 'approver' ? 'Approval Queue' : variant === 'accounting' ? 'Financial Overview' : 'Dashboard'}
        </h2>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-muted uppercase tracking-wider">
          {variant}
        </span>
      </div>

      {/* ── FIELD WORKER VARIANT ────────────────────────── */}
      {variant === 'field' && (
        <>
          {/* My stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<PendingIcon />}
              label="My Pending"
              value={myPending.length}
              sub={`${formatCurrency(myPending.reduce((s, r) => s + r.estimatedTotal, 0))} total`}
            />
            <StatCard
              icon={<CheckIcon />}
              label="My Approved"
              value={myApproved.length}
              sub={`${formatCurrency(myApproved.reduce((s, r) => s + r.estimatedTotal, 0))} committed`}
            />
            <StatCard
              icon={<CartIcon />}
              label="My Purchased"
              value={myPurchased.length}
              sub={`${formatCurrency(myPurchased.reduce((s, r) => s + (r.finalTotal ?? r.estimatedTotal), 0))} spent`}
            />
          </div>

          {/* My recent requests */}
          <RequestTable
            title="My Recent Requests"
            linkHref="/queue"
            requests={myRequests.slice(0, 5)}
            getProject={getProject}
            showStatus
          />
        </>
      )}

      {/* ── APPROVER VARIANT ────────────────────────────── */}
      {variant === 'approver' && (
        <>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 grid grid-cols-3 gap-4">
              <StatCard icon={<PendingIcon />} label="Pending Approval" value={pending.length} sub={`${formatCurrency(pendingTotal)} total value`} />
              <StatCard icon={<CheckIcon />} label="Approved" value={approved.length} sub={`${formatCurrency(approvedTotal)} committed`} />
              <StatCard icon={<CartIcon />} label="Purchased" value={purchased.length} sub={`${formatCurrency(purchasedTotal)} spent`} />
            </div>
            <ActivitySidebar entries={recentActivity} requests={requests} getUser={getUser} />
          </div>

          {/* Pending queue */}
          <RequestTable
            title="Pending Requests"
            linkHref="/queue"
            requests={topPending}
            getProject={getProject}
            showUrgency
          />

          <BudgetOverview projects={projects} getBudgetSnapshot={getBudgetSnapshot} />
        </>
      )}

      {/* ── ACCOUNTING VARIANT ──────────────────────────── */}
      {variant === 'accounting' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard icon={<PendingIcon />} label="Pending" value={pending.length} sub={formatCurrency(pendingTotal)} />
            <StatCard icon={<CheckIcon />} label="Approved" value={approved.length} sub={formatCurrency(approvedTotal)} />
            <StatCard icon={<CartIcon />} label="Purchased" value={purchased.length} sub={formatCurrency(purchasedTotal)} />
            <StatCard
              icon={<AlertIcon />}
              label="Needs Attention"
              value={needsAttention.length}
              sub="missing coding"
              highlight={needsAttention.length > 0}
            />
          </div>

          {/* Needs Attention shortcut */}
          {needsAttention.length > 0 && (
            <div className="bg-warning-soft border border-warning/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-semibold text-text">{needsAttention.length} request{needsAttention.length !== 1 ? 's' : ''} need financial coding</p>
                    <p className="text-[11px] text-text-muted">Approved requests missing cost code, vendor, or PO reference</p>
                  </div>
                </div>
                <Link href="/needs-attention" className="px-3 py-1.5 text-[11px] font-medium text-warning border border-warning/30 rounded-lg hover:bg-warning/10 transition-colors">
                  Review Now
                </Link>
              </div>
            </div>
          )}

          <BudgetOverview projects={projects} getBudgetSnapshot={getBudgetSnapshot} />
          <FinancialHealthSection projects={projects} requests={requests} getBudgetSnapshot={getBudgetSnapshot} />
        </>
      )}

      {/* ── ADMIN VARIANT ───────────────────────────────── */}
      {variant === 'admin' && (
        <>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 grid grid-cols-3 gap-4">
              <StatCard icon={<PendingIcon />} label="Pending Approval" value={pending.length} sub={`${formatCurrency(pendingTotal)} total value`} />
              <StatCard icon={<CheckIcon />} label="Approved" value={approved.length} sub={`${formatCurrency(approvedTotal)} committed`} />
              <StatCard icon={<CartIcon />} label="Purchased" value={purchased.length} sub={`${formatCurrency(purchasedTotal)} spent`} />
            </div>
            <ActivitySidebar entries={recentActivity} requests={requests} getUser={getUser} />
          </div>

          {/* Needs Attention banner */}
          {needsAttention.length > 0 && (
            <div className="bg-warning-soft border border-warning/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span className="text-[13px] font-medium text-text">{needsAttention.length} request{needsAttention.length !== 1 ? 's' : ''} need attention</span>
                </div>
                <Link href="/needs-attention" className="text-[12px] font-medium text-warning hover:text-warning-hover transition-colors">
                  View &gt;
                </Link>
              </div>
            </div>
          )}

          <RequestTable
            title="Pending Requests"
            linkHref="/queue"
            requests={topPending}
            getProject={getProject}
            showUrgency
          />

          <BudgetOverview projects={projects} getBudgetSnapshot={getBudgetSnapshot} />
          <FinancialHealthSection projects={projects} requests={requests} getBudgetSnapshot={getBudgetSnapshot} />
        </>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-warning-soft border-warning/20' : 'bg-white border-border'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[13px] font-medium text-text">{label}</span>
      </div>
      <div className={`text-[28px] font-bold leading-tight ${highlight ? 'text-warning' : 'text-text'}`}>{value}</div>
      <div className="text-[12px] text-text-muted mt-1">{sub}</div>
    </div>
  );
}

// ── Activity Sidebar ───────────────────────────────────────

function ActivitySidebar({
  entries,
  requests,
  getUser,
}: {
  entries: { id: string; userId: string; requestId: string; action: string; timestamp: string }[];
  requests: PurchaseRequest[];
  getUser: (id: string) => { id: string; name: string } | undefined;
}) {
  return (
    <div className="w-[280px] bg-white rounded-xl border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-text">Recent Activity</h3>
      </div>
      <div className="space-y-4 flex-1">
        {entries.map((entry) => {
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
  );
}

// ── Request Table ──────────────────────────────────────────

function RequestTable({
  title,
  linkHref,
  requests,
  getProject,
  showStatus,
  showUrgency,
}: {
  title: string;
  linkHref: string;
  requests: PurchaseRequest[];
  getProject: (id: string) => Project | undefined;
  showStatus?: boolean;
  showUrgency?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-semibold text-text">{title}</h3>
        <Link href={linkHref} className="text-[13px] font-medium text-primary hover:text-primary-hover transition-colors">
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
          {requests.map((req) => {
            const project = getProject(req.projectId);
            return (
              <tr key={req.id} className="border-t border-border-light">
                <td className="py-3.5 pl-2 text-[13px] text-text-muted">{formatRelativeTime(req.createdAt)}</td>
                <td className="py-3.5 text-[13px] text-text font-medium">{req.poNumber}</td>
                <td className="py-3.5 text-[13px] text-text">{req.vendor}</td>
                <td className="py-3.5 text-[13px] text-text">{project?.name}</td>
                <td className="py-3.5 text-[13px] text-text">{formatCurrency(req.estimatedTotal)}</td>
                <td className="py-3.5">
                  {showUrgency && req.urgency === 'urgent' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-danger text-white">
                      Urgent
                    </span>
                  ) : showStatus ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                      req.status === 'pending' ? 'bg-warning-soft text-warning' :
                      req.status === 'approved' ? 'bg-success-soft text-success' :
                      req.status === 'rejected' ? 'bg-danger-soft text-danger' :
                      req.status === 'purchased' ? 'bg-primary-soft text-primary' :
                      'bg-surface text-text-muted'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-[13px] text-text-muted">
                No requests
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Budget Overview ────────────────────────────────────────

function BudgetOverview({
  projects,
  getBudgetSnapshot,
}: {
  projects: Project[];
  getBudgetSnapshot: (projectId: string) => { monthlyBudget: number; approvedTotal: number; purchasedTotal: number };
}) {
  return (
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
                    isOnTrack ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                  }`}>
                    {isOnTrack ? 'On Track' : 'At Risk'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="text-text">{formatCurrency(spent)} / {formatCurrency(snapshot.monthlyBudget)}</span>
                  <span className="text-text-muted">{pct}%</span>
                </div>
              </div>
              <div className="w-full bg-surface rounded-full h-2">
                <div className="h-2 rounded-full transition-all bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Financial Health Section ───────────────────────────────

interface BudgetSnapshotData {
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
  getBudgetSnapshot: (projectId: string) => BudgetSnapshotData;
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

// ── Budget Bar ─────────────────────────────────────────────

function BudgetBar({ name, budget, committed, actual }: { name: string; budget: number; committed: number; actual: number }) {
  const pctActual = budget > 0 ? (actual / budget) * 100 : 0;
  const pctCommitted = budget > 0 ? (committed / budget) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-text">{name}</span>
        <span className="text-[11px] text-text-muted tabular-nums">{formatCurrency(budget)}</span>
      </div>
      <div className="w-full bg-surface rounded-full h-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-3 rounded-full bg-success/40 transition-all" style={{ width: `${Math.min(pctCommitted, 100)}%` }} />
        <div className="absolute top-0 left-0 h-3 rounded-full bg-primary transition-all" style={{ width: `${Math.min(pctActual, 100)}%` }} />
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-text-muted tabular-nums">Actual: {formatCurrency(actual)}</span>
        <span className="text-[10px] text-text-muted tabular-nums">Committed: {formatCurrency(committed)}</span>
        <span className="text-[10px] text-text-muted tabular-nums">Remaining: {formatCurrency(Math.max(budget - committed, 0))}</span>
      </div>
    </div>
  );
}

// ── Spend Chart (canvas) ───────────────────────────────────

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

    const maxVal = Math.max(...data.map((d) => Math.max(d.approved, d.purchased)), 1);
    const niceMax = Math.ceil(maxVal / 1000) * 1000;

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

    ctx.textAlign = 'center';
    const labelInterval = Math.floor(data.length / 5);
    for (let i = 0; i < data.length; i += labelInterval) {
      const x = padLeft + (i / (data.length - 1)) * chartW;
      const d = new Date(data[i].date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      ctx.fillText(label, x, H - 4);
    }

    function drawLine(values: number[], color: string, fillAlpha: number) {
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

      const lastX = padLeft + chartW;
      const baseline = padTop + chartH;
      ctx.lineTo(lastX, baseline);
      ctx.lineTo(padLeft, baseline);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', `, ${fillAlpha})`).replace('rgb', 'rgba');
      ctx.fill();
    }

    drawLine(data.map((d) => d.approved), 'rgb(31, 58, 95)', 0.08);
    drawLine(data.map((d) => d.purchased), 'rgb(30, 127, 79)', 0.08);
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

// ── Shared helpers ─────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────

function PendingIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-white" />
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </div>
  );
}

function CartIcon() {
  return (
    <div className="w-5 h-5 flex items-center justify-center text-primary">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    </div>
  );
}

function AlertIcon() {
  return (
    <div className="w-5 h-5 flex items-center justify-center text-warning">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  );
}
