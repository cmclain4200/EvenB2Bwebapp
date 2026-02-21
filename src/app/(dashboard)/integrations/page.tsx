'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useDataStore } from '@/lib/data-store';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

// ── Types ────────────────────────────────────────

interface IntegrationConnection {
  id: string;
  organization_id: string;
  provider: 'qbo' | 'procore';
  status: 'connected' | 'disconnected' | 'error';
  external_company_name: string | null;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'error';

// ── Helpers ──────────────────────────────────────

function formatSyncTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

// ── Main Page ────────────────────────────────────

export default function IntegrationsPage() {
  const { session, profile, organization } = useAuthStore();
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const orgId = profile?.organization_id;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch connections ──────────────────────────

  const fetchConnections = useCallback(async () => {
    if (!orgId) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;
      setConnections(data ?? []);
    } catch (err) {
      console.error('Failed to fetch integration connections:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // ── Connection helpers ─────────────────────────

  const getConnection = (provider: string): IntegrationConnection | undefined => {
    return connections.find((c) => c.provider === provider);
  };

  const getStatus = (provider: string): ConnectionStatus => {
    const conn = getConnection(provider);
    if (!conn) return 'disconnected';
    return conn.status;
  };

  // ── Actions ────────────────────────────────────

  const handleConnect = (provider: 'qbo' | 'procore') => {
    if (!orgId) return;
    const returnUrl = window.location.href;
    window.location.href = `${supabaseUrl}/functions/v1/integration-oauth/connect?provider=${provider}&org_id=${orgId}&return_url=${encodeURIComponent(returnUrl)}`;
  };

  const handleDisconnect = async (provider: 'qbo' | 'procore') => {
    if (!session || !orgId) return;
    if (!confirm(`Disconnect ${provider === 'qbo' ? 'QuickBooks Online' : 'Procore'}? This will stop all syncing.`)) return;

    setDisconnectingProvider(provider);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/integration-api`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect', provider }),
      });

      if (!res.ok) throw new Error('Disconnect failed');
      showToast(`${provider === 'qbo' ? 'QuickBooks' : 'Procore'} disconnected`);
      await fetchConnections();
    } catch (err) {
      showToast('Failed to disconnect. Please try again.', 'error');
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const handleTestConnection = async (provider: 'qbo' | 'procore') => {
    if (!session) return;
    setTestingProvider(provider);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/integration-api`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test', provider }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${provider === 'qbo' ? 'QuickBooks' : 'Procore'} connection is healthy`);
      } else {
        showToast(data.error || 'Connection test failed', 'error');
      }
      await fetchConnections();
    } catch (err) {
      showToast('Connection test failed', 'error');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleExport = async (exportType: string) => {
    if (!session) return;
    setExportingType(exportType);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/integration-export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: exportType }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`${exportType.replace(/-/g, ' ')} exported`);
    } catch (err) {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // ── Render ─────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[16px] font-semibold text-text">Integrations</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Connect your accounting and project management tools
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* QuickBooks Online */}
          <IntegrationCard
            title="QuickBooks Online"
            description="Sync purchase orders, vendors, and cost codes with your QuickBooks account."
            provider="qbo"
            connection={getConnection('qbo')}
            status={getStatus('qbo')}
            isTesting={testingProvider === 'qbo'}
            isDisconnecting={disconnectingProvider === 'qbo'}
            onConnect={() => handleConnect('qbo')}
            onDisconnect={() => handleDisconnect('qbo')}
            onTest={() => handleTestConnection('qbo')}
            mappingsHref="/integrations/mappings?provider=qbo"
          />

          {/* Procore */}
          <IntegrationCard
            title="Procore"
            description="Sync projects, budgets, and commitments with your Procore account."
            provider="procore"
            connection={getConnection('procore')}
            status={getStatus('procore')}
            isTesting={testingProvider === 'procore'}
            isDisconnecting={disconnectingProvider === 'procore'}
            onConnect={() => handleConnect('procore')}
            onDisconnect={() => handleDisconnect('procore')}
            onTest={() => handleTestConnection('procore')}
            mappingsHref="/integrations/mappings?provider=procore"
          />

          {/* Excel Export */}
          <ExcelExportCard
            exportingType={exportingType}
            onExport={handleExport}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-[12px] font-medium px-4 py-2.5 rounded shadow-lg flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-danger' : 'bg-primary'
        }`}>
          {toast.type === 'error' && (
            <ErrorIcon className="w-3.5 h-3.5 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Integration Card ─────────────────────────────

function IntegrationCard({
  title,
  description,
  provider,
  connection,
  status,
  isTesting,
  isDisconnecting,
  onConnect,
  onDisconnect,
  onTest,
  mappingsHref,
}: {
  title: string;
  description: string;
  provider: string;
  connection: IntegrationConnection | undefined;
  status: ConnectionStatus;
  isTesting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
  mappingsHref: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
            {provider === 'qbo' ? (
              <QuickBooksIcon className="w-5 h-5 text-text-muted" />
            ) : (
              <ProcoreIcon className="w-5 h-5 text-text-muted" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-text">{title}</h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Connected state */}
      {status === 'connected' && connection && (
        <div className="mt-4 pt-4 border-t border-border">
          {/* Connection details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                Company
              </span>
              <span className="text-[12px] text-text font-medium">
                {connection.external_company_name || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                Last Sync
              </span>
              <span className="text-[12px] text-text">
                {formatSyncTime(connection.last_sync_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTest}
              disabled={isTesting}
              className="px-3 py-1.5 text-[11px] font-medium text-text border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
                  Testing...
                </span>
              ) : (
                'Test Connection'
              )}
            </button>

            <Link
              href={mappingsHref}
              className="px-3 py-1.5 text-[11px] font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Manage Mappings
            </Link>

            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 text-[11px] font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger-soft transition-colors disabled:opacity-50 ml-auto"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && connection && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="bg-danger-soft rounded-lg px-3 py-2 mb-4">
            <p className="text-[11px] text-danger font-medium">
              {connection.error_message || 'Connection error. Please reconnect.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Reconnect
            </button>
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 text-[11px] font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger-soft transition-colors disabled:opacity-50"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}

      {/* Disconnected state */}
      {status === 'disconnected' && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={onConnect}
            className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Connect {title}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Status Badge ─────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { label: string; className: string }> = {
    connected: {
      label: 'Connected',
      className: 'bg-success-soft text-success',
    },
    error: {
      label: 'Error',
      className: 'bg-danger-soft text-danger',
    },
    disconnected: {
      label: 'Not connected',
      className: 'bg-surface text-text-muted',
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── Excel Export Card ────────────────────────────

const EXPORT_OPTIONS = [
  {
    key: 'project-summary',
    label: 'Project Summary',
    description: 'Budget vs. actual for all active projects',
  },
  {
    key: 'reimbursements',
    label: 'Reimbursements',
    description: 'All pending and completed reimbursement records',
  },
  {
    key: 'approval-log',
    label: 'Approval Log',
    description: 'Full audit trail of purchase request approvals',
  },
  {
    key: 'cost-code-breakdown',
    label: 'Cost Code Breakdown',
    description: 'Spending by cost code across all projects',
  },
];

function ExcelExportCard({
  exportingType,
  onExport,
}: {
  exportingType: string | null;
  onExport: (type: string) => void;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
          <ExcelIcon className="w-5 h-5 text-text-muted" />
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-text">Excel Export</h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            Download reports as Excel spreadsheets
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-3">
          {EXPORT_OPTIONS.map((opt) => {
            const isExporting = exportingType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onExport(opt.key)}
                disabled={!!exportingType}
                className="text-left px-4 py-3 border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text group-hover:text-primary transition-colors">
                    {opt.label}
                  </span>
                  {isExporting ? (
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DownloadIcon className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
                  )}
                </div>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────

function QuickBooksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12h3m0 0V9m0 3v3m5-3h-3m0 0V9m0 3v3" strokeLinecap="round" />
    </svg>
  );
}

function ProcoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M3 9h18M3 15h18" />
      <path d="M13 11l4 4m0-4l-4 4" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
