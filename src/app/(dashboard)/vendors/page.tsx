'use client';

import { useState } from 'react';
import { useDataStore } from '@/lib/data-store';
import { useAuthStore } from '@/lib/auth-store';
import { createClient } from '@/lib/supabase-browser';

export default function VendorsPage() {
  const { vendors } = useDataStore();
  const { organization } = useAuthStore();
  const orgId = organization?.id;

  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const supabase = createClient();

  // Filter vendors by search term
  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Add vendor ──
  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !orgId) return;
    setAdding(true);
    try {
      await supabase.from('vendors').insert({
        organization_id: orgId,
        name: trimmed,
        external_source: 'manual',
      });
      setNewName('');
      await useDataStore.getState().refresh();
    } catch {
      console.error('Failed to add vendor');
    } finally {
      setAdding(false);
    }
  };

  // ── Toggle active/inactive ──
  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await supabase
        .from('vendors')
        .update({ is_active: !currentActive })
        .eq('id', id);
      await useDataStore.getState().refresh();
    } catch {
      console.error('Failed to toggle vendor');
    }
  };

  // ── CSV Import ──
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      // Skip header row if it looks like a header
      const startIdx = lines[0]?.toLowerCase() === 'name' ? 1 : 0;
      const names = lines.slice(startIdx).filter((n) => n.length > 0);

      if (names.length === 0) return;

      const rows = names.map((name) => ({
        organization_id: orgId,
        name,
        external_source: 'import' as const,
      }));

      await supabase.from('vendors').insert(rows);
      await useDataStore.getState().refresh();
    } catch {
      console.error('Failed to import CSV');
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // ── Source badge styles ──
  const sourceBadge = (source: string) => {
    switch (source) {
      case 'quickbooks':
        return 'bg-success-soft text-success';
      case 'procore':
        return 'bg-primary-soft text-primary';
      case 'import':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-surface text-text-muted';
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'quickbooks':
        return 'QuickBooks';
      case 'procore':
        return 'Procore';
      case 'import':
        return 'Import';
      default:
        return 'Manual';
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-text">Vendors</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Manage your organization&apos;s vendor list
          </p>
        </div>

        {/* CSV Import */}
        <label
          className={`px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer ${
            importing ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {importing ? 'Importing...' : 'Import CSV'}
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Search + Inline Add */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white placeholder:text-text-muted"
        />
        <input
          type="text"
          placeholder="New vendor name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-56 px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white placeholder:text-text-muted"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Vendors Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[13px]">
          {vendors.length === 0
            ? 'No vendors yet. Add one above or import a CSV.'
            : 'No vendors match your search.'}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">
                  Source
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">
                  Status
                </th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border-light">
                  <td className="px-4 py-3">
                    <span className="font-medium text-text">{v.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${sourceBadge(
                        v.externalSource
                      )}`}
                    >
                      {sourceLabel(v.externalSource)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        v.isActive
                          ? 'bg-success-soft text-success'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(v.id, v.isActive)}
                      className={`text-[11px] hover:underline ${
                        v.isActive ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {v.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
