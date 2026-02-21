'use client';

import { useState } from 'react';
import { useDataStore, PurchaseRequest } from '@/lib/data-store';
import { useAuthStore } from '@/lib/auth-store';
import { formatCurrency } from '@/lib/utils';

export default function NeedsAttentionPage() {
  const store = useDataStore();
  const { can } = useAuthStore();
  const needsAttention = store.getNeedsAttention();
  const canEdit = can('finance.edit_proposal_coding');
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="px-8 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          {needsAttention.length > 0 ? (
            <>
              <div className="w-6 h-6 rounded-full bg-warning-soft flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-text">
                <span className="font-bold">{needsAttention.length}</span> approved request{needsAttention.length !== 1 ? 's' : ''} need{needsAttention.length === 1 ? 's' : ''} financial coding before purchase
              </span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-text">All caught up! No requests need attention.</span>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {needsAttention.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <svg className="w-12 h-12 mb-3 text-text-muted/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[14px] font-medium">No requests need attention</p>
            <p className="text-[12px] mt-1">All approved requests have complete financial coding.</p>
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">PO #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Vendor</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Project</th>
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Amount</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Missing</th>
                {canEdit && (
                  <th className="text-right px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {needsAttention.map((r) => (
                <AttentionRow
                  key={r.id}
                  request={r}
                  canEdit={canEdit}
                  isEditing={editingId === r.id}
                  onEdit={() => setEditingId(editingId === r.id ? null : r.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AttentionRow({
  request,
  canEdit,
  isEditing,
  onEdit,
}: {
  request: PurchaseRequest;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
}) {
  const store = useDataStore();
  const project = store.getProjectById(request.projectId);
  const costCode = store.getCostCodeById(request.costCodeId);
  const vendor = request.vendorId ? store.getVendorById(request.vendorId) : null;
  const settings = store.getProjectFinancialSettings(request.projectId);

  const missing: string[] = [];
  if (settings.requireCostCode && !request.costCodeId) missing.push('Cost Code');
  if (settings.requireVendor && !request.vendorId) missing.push('Vendor');
  if (settings.requirePoNumber && !(request.poReference || '').trim()) missing.push('PO #');
  if (settings.requireReceiptAttachment && request.receiptAttachments.length === 0) missing.push('Receipt');
  if (settings.requireDescription && !request.notes.trim()) missing.push('Description');

  return (
    <>
      <tr className={`border-b border-border-light hover:bg-surface/60 transition-colors ${isEditing ? 'bg-surface/40' : ''}`}>
        <td className="px-4 py-3">
          <span className="font-mono font-medium text-text">{request.poNumber}</span>
        </td>
        <td className="px-4 py-3">
          <span className="font-medium text-text">{request.vendor}</span>
          {vendor && <span className="block text-[10px] text-text-muted mt-0.5">{vendor.name}</span>}
        </td>
        <td className="px-4 py-3">
          <span className="text-text">{project?.name}</span>
          <span className="block text-[10px] text-text-muted font-mono mt-0.5">{project?.jobNumber}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-medium text-text tabular-nums">{formatCurrency(request.estimatedTotal)}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {missing.map((field) => (
              <span
                key={field}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-danger-soft text-danger"
              >
                {field}
              </span>
            ))}
          </div>
        </td>
        {canEdit && (
          <td className="px-4 py-3 text-right">
            <button
              onClick={onEdit}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                isEditing
                  ? 'text-text-muted bg-surface'
                  : 'text-primary border border-primary/20 hover:bg-primary-soft'
              }`}
            >
              {isEditing ? 'Cancel' : 'Update Coding'}
            </button>
          </td>
        )}
      </tr>
      {isEditing && canEdit && (
        <tr className="border-b border-border-light bg-surface/30">
          <td colSpan={canEdit ? 6 : 5} className="px-4 py-4">
            <CodingForm
              request={request}
              currentCostCode={costCode?.id}
              currentVendor={request.vendorId}
              currentPoRef={request.poReference}
              currentNotes={request.accountingNotes}
              onSaved={onEdit}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function CodingForm({
  request,
  currentCostCode,
  currentVendor,
  currentPoRef,
  currentNotes,
  onSaved,
}: {
  request: PurchaseRequest;
  currentCostCode?: string;
  currentVendor?: string;
  currentPoRef?: string;
  currentNotes?: string;
  onSaved: () => void;
}) {
  const store = useDataStore();
  const activeCostCodes = store.getActiveCostCodes();
  const activeVendors = store.getActiveVendors();

  const [costCodeId, setCostCodeId] = useState(currentCostCode || '');
  const [vendorId, setVendorId] = useState(currentVendor || '');
  const [poReference, setPoReference] = useState(currentPoRef || '');
  const [accountingNotes, setAccountingNotes] = useState(currentNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await store.updateCoding(request.id, {
        costCodeId: costCodeId || undefined,
        vendorId: vendorId || undefined,
        poReference: poReference || undefined,
        accountingNotes: accountingNotes || undefined,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <div>
        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Cost Code</label>
        <select
          value={costCodeId}
          onChange={(e) => setCostCodeId(e.target.value)}
          className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-white text-text focus:outline-none focus:border-primary"
        >
          <option value="">Select...</option>
          {activeCostCodes.map((cc) => (
            <option key={cc.id} value={cc.id}>
              {cc.code} – {cc.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Vendor</label>
        <select
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-white text-text focus:outline-none focus:border-primary"
        >
          <option value="">Select...</option>
          {activeVendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">PO Reference</label>
        <input
          type="text"
          value={poReference}
          onChange={(e) => setPoReference(e.target.value)}
          placeholder="e.g. EXT-PO-1234"
          className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-white text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Notes</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={accountingNotes}
            onChange={(e) => setAccountingNotes(e.target.value)}
            placeholder="Accounting notes..."
            className="flex-1 px-2 py-1.5 text-[12px] border border-border rounded bg-white text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-[11px] font-medium text-white bg-primary rounded hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && <p className="text-[10px] text-danger mt-1">{error}</p>}
      </div>
    </div>
  );
}
