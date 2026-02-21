'use client';

import { useState } from 'react';

const QUICK_REASONS = [
  'Over budget',
  'Wrong cost code',
  'Need more detail',
  'Use alternate vendor',
  'Not needed',
];

interface RejectModalProps {
  poNumber: string;
  onReject: (reason: string) => void;
  onClose: () => void;
}

export function RejectModal({ poNumber, onReject, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-text/20" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[14px] font-semibold text-text mb-1">Reject {poNumber}</h3>
        <p className="text-[12px] text-text-muted mb-4">Provide a reason so the requester can fix and resubmit.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                reason === r
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-text-muted hover:border-primary/30 hover:text-text'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Or type a custom reason..."
          className="w-full border border-border rounded-lg px-3 py-2 text-[12px] text-text bg-surface resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-text-muted hover:text-text rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onReject(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-[12px] font-medium text-white bg-danger rounded hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}
