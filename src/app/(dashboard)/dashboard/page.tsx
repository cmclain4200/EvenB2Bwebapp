'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useDataStore } from '@/lib/data-store';
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
      <div className="bg-white rounded-xl border border-border p-6">
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
    </div>
  );
}
