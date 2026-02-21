'use client';

import { useState } from 'react';
import { useStore } from '@/data/store';
import { PurchaseRequest } from '@/data/types';
import { StatusChip, UrgencyChip } from './StatusChip';
import { RejectModal } from './RejectModal';
import { CostCodePicker } from './CostCodePicker';
import { formatCurrency, formatDate, formatRelativeTime, NEED_BY_LABELS, CATEGORY_LABELS, PHASE_LABELS } from '@/lib/utils';

interface RequestDetailDrawerProps {
  request: PurchaseRequest;
  onClose: () => void;
  onApprove?: (request: PurchaseRequest) => void;
  onReject?: (request: PurchaseRequest, reason: string) => void;
}

export function RequestDetailDrawer({ request, onClose, onApprove, onReject }: RequestDetailDrawerProps) {
  const store = useStore();
  const requester = store.getUserById(request.requesterId);
  const project = store.getProjectById(request.projectId);
  const costCode = store.getCostCodeById(request.costCodeId);
  const [showReject, setShowReject] = useState(false);
  const [editCostCode, setEditCostCode] = useState(request.costCodeId);

  // Budget impact
  const impact = store.getBudgetImpact(request.projectId, request.estimatedTotal);
  const canApprove = store.canCurrentUserApprove(request.estimatedTotal);
  const vendorCount = store.getVendorPOCount(request.vendor);

  const handleApprove = () => {
    if (onApprove) {
      if (editCostCode !== request.costCodeId) {
        store.updateRequest(request.id, { costCodeId: editCostCode });
      }
      onApprove(request);
    } else {
      store.approveRequest(request.id, editCostCode);
    }
    onClose();
  };

  const handleReject = (reason: string) => {
    if (onReject) {
      onReject(request, reason);
    } else {
      store.rejectRequest(request.id, reason);
    }
    setShowReject(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-text/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-xl border-l border-border flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[15px] font-semibold text-text">{request.poNumber}</h2>
              <StatusChip status={request.status} />
              <UrgencyChip urgency={request.urgency} />
            </div>
            <p className="text-[11px] text-text-muted">
              Submitted {formatRelativeTime(request.createdAt)} · {formatDate(request.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-surface flex items-center justify-center text-text-muted transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Budget Impact Banner (pending only) */}
          {request.status === 'pending' && (
            <div className={`rounded border px-4 py-3 ${
              impact.overBudget
                ? 'bg-danger-soft border-danger/15'
                : impact.atRisk
                ? 'bg-warning-soft border-warning/15'
                : 'bg-surface border-border-light'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Budget Impact</span>
                <span className={`text-[12px] font-semibold tabular-nums ${
                  impact.overBudget ? 'text-danger' : impact.atRisk ? 'text-warning' : 'text-text'
                }`}>
                  {impact.currentPct}% → {impact.afterPct}%
                </span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-sm overflow-hidden flex">
                <div
                  className={`h-full ${impact.overBudget ? 'bg-danger/60' : impact.atRisk ? 'bg-warning/60' : 'bg-primary/60'}`}
                  style={{ width: `${Math.min(impact.currentPct, 100)}%` }}
                />
                <div
                  className={`h-full ${impact.overBudget ? 'bg-danger' : impact.atRisk ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${Math.min(impact.afterPct - impact.currentPct, 100 - Math.min(impact.currentPct, 100))}%` }}
                />
              </div>
              {impact.overBudget && (
                <p className="text-[11px] text-danger font-medium mt-1.5">This PO will push the project over budget.</p>
              )}
              {impact.atRisk && !impact.overBudget && (
                <p className="text-[11px] text-warning font-medium mt-1.5">This PO brings the project above 80% utilization.</p>
              )}
            </div>
          )}

          {/* Vendor Frequency Alert */}
          {vendorCount >= 2 && request.status === 'pending' && (
            <div className="rounded border border-warning/15 bg-warning-soft px-4 py-2.5 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-[11px] text-warning font-medium">
                {vendorCount} POs from {request.vendor} this month
              </span>
            </div>
          )}

          {/* Approval Threshold Warning */}
          {request.status === 'pending' && !canApprove && (
            <div className="rounded border border-border bg-surface px-4 py-2.5 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[11px] text-text-muted font-medium">
                Exceeds your ${store.currentUser.approvalLimit?.toLocaleString()} approval limit. Requires {request.estimatedTotal > 25000 ? 'executive' : 'admin'} approval.
              </span>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetaField label="Project" value={project?.name ?? '—'} sub={`${project?.jobNumber} · ${project ? PHASE_LABELS[project.phase] : ''}`} />
            <MetaField label="Requester" value={requester?.name ?? '—'} sub={requester?.role ? capitalize(requester.role) : undefined} />
            <MetaField label="Vendor" value={request.vendor} />
            <MetaField label="Category" value={CATEGORY_LABELS[request.category]} />
            <MetaField label="Need By" value={NEED_BY_LABELS[request.needBy]} highlight={request.needBy === 'today'} />
            <MetaField label="Delivery" value={request.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'} />
          </div>

          {/* Cost Code */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Cost Code</p>
            {request.status === 'pending' ? (
              <CostCodePicker value={editCostCode} onChange={setEditCostCode} />
            ) : (
              <p className="text-[12px] font-medium text-text">
                {costCode ? `${costCode.code} ${costCode.label}` : '—'}
              </p>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-[12px] font-semibold text-text mb-2">Line Items</h3>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-[12px]">
                <thead className="bg-surface">
                  <tr>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Item</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Qty</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Unit Cost</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {request.lineItems.map((li) => (
                    <tr key={li.id} className="border-t border-border-light">
                      <td className="px-3 py-2 text-text">{li.name}</td>
                      <td className="px-3 py-2 text-right text-text-muted tabular-nums">{li.quantity} {li.unit}</td>
                      <td className="px-3 py-2 text-right text-text-muted tabular-nums">{formatCurrency(li.estimatedUnitCost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-text tabular-nums">
                        {formatCurrency(li.quantity * li.estimatedUnitCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-surface">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-text">
                      Estimated Total
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text tabular-nums">
                      {formatCurrency(request.estimatedTotal)}
                    </td>
                  </tr>
                  {request.finalTotal !== undefined && (
                    <tr className="border-t border-border-light">
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold text-success">
                        Final Total
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-success tabular-nums">
                        {formatCurrency(request.finalTotal)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div>
              <h3 className="text-[12px] font-semibold text-text mb-1.5">Notes</h3>
              <p className="text-[12px] text-text-muted bg-surface rounded px-3 py-2.5 border border-border-light">{request.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {request.attachments.length > 0 && (
            <div>
              <h3 className="text-[12px] font-semibold text-text mb-1.5">
                Attachments ({request.attachments.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                {request.attachments.map((a, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded bg-surface border border-border flex flex-col items-center justify-center text-text-muted hover:border-primary cursor-pointer transition-colors"
                    title={a.split('/').pop()}
                  >
                    <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-[9px] truncate max-w-[56px]">{a.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt Attachments */}
          {request.receiptAttachments.length > 0 && (
            <div>
              <h3 className="text-[12px] font-semibold text-text mb-1.5">
                Receipts ({request.receiptAttachments.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                {request.receiptAttachments.map((a, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded bg-success-soft border border-success/15 flex flex-col items-center justify-center text-success cursor-pointer hover:border-success transition-colors"
                    title={a.split('/').pop()}
                  >
                    <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 3H12.75a2.25 2.25 0 00-2.15 1.586m0 0a2.251 2.251 0 01-.88-.08" />
                    </svg>
                    <span className="text-[9px] truncate max-w-[56px]">{a.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {request.status === 'rejected' && request.rejectionReason && (
            <div className="bg-danger-soft border border-danger/15 rounded px-4 py-3">
              <p className="text-[12px] font-semibold text-danger mb-1">Rejected</p>
              <p className="text-[12px] text-text">{request.rejectionReason}</p>
              {request.rejectedBy && (
                <p className="text-[11px] text-text-muted mt-1.5">
                  By {store.getUserById(request.rejectedBy)?.name} · {request.rejectedAt && formatDate(request.rejectedAt)}
                </p>
              )}
            </div>
          )}

          {/* Approval info */}
          {(request.status === 'approved' || request.status === 'purchased') && request.approvedBy && (
            <div className="bg-success-soft border border-success/15 rounded px-4 py-3">
              <p className="text-[12px] font-semibold text-primary mb-1">Approved</p>
              <p className="text-[11px] text-text-muted">
                By {store.getUserById(request.approvedBy)?.name} · {request.approvedAt && formatDate(request.approvedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {request.status === 'pending' && (
          <div className="shrink-0 bg-white border-t border-border px-6 py-3 flex gap-3">
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 px-4 py-2 text-[12px] font-medium text-danger border border-danger/20 rounded hover:bg-danger-soft transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={!canApprove}
              className={`flex-1 px-4 py-2 text-[12px] font-medium rounded transition-colors ${
                canApprove
                  ? 'text-white bg-primary hover:bg-primary-hover'
                  : 'text-text-muted bg-surface cursor-not-allowed'
              }`}
              title={!canApprove ? `Exceeds your $${store.currentUser.approvalLimit?.toLocaleString()} limit` : undefined}
            >
              {canApprove ? 'Approve' : 'Exceeds Limit'}
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <RejectModal
          poNumber={request.poNumber}
          onReject={handleReject}
          onClose={() => setShowReject(false)}
        />
      )}
    </>
  );
}

function MetaField({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-[12px] font-medium ${highlight ? 'text-danger' : 'text-text'}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
