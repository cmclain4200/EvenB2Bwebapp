'use client';

import { useState } from 'react';
import { useDataStore } from '@/lib/data-store';
import { useAuthStore } from '@/lib/auth-store';
import { createClient } from '@/lib/supabase-browser';

const CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'other', label: 'Other' },
] as const;

const SOURCE_BADGE_STYLES: Record<string, string> = {
  manual: 'bg-gray-100 text-gray-600',
  quickbooks: 'bg-emerald-50 text-emerald-700',
  procore: 'bg-blue-50 text-blue-700',
  import: 'bg-purple-50 text-purple-700',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  quickbooks: 'QuickBooks',
  procore: 'Procore',
  import: 'Import',
};

export default function CostCodesPage() {
  const { organization } = useAuthStore();
  const orgId = organization?.id;
  const { costCodes, loading } = useDataStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('labor');
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const supabase = createClient();

  // ── Create cost code ──
  const handleCreate = async () => {
    if (!orgId || !newCode.trim() || !newName.trim()) return;
    setCreating(true);

    try {
      const { error } = await supabase.from('cost_codes').insert({
        organization_id: orgId,
        code: newCode.trim(),
        label: newName.trim(),
        category: newCategory,
        external_source: 'manual',
      });

      if (error) throw error;

      setNewCode('');
      setNewName('');
      setNewCategory('labor');
      setShowCreate(false);
      await useDataStore.getState().refresh();
    } catch (err) {
      console.error('Failed to create cost code:', err);
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle active/inactive ──
  const handleToggle = async (id: string, currentActive: boolean) => {
    setToggling(id);
    try {
      const { error } = await supabase
        .from('cost_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      await useDataStore.getState().refresh();
    } catch (err) {
      console.error('Failed to toggle cost code:', err);
    } finally {
      setToggling(null);
    }
  };

  // ── Import CSV ──
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

      if (lines.length < 2) {
        setImportError('CSV must have a header row and at least one data row.');
        return;
      }

      // Parse header
      const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
      const codeIdx = header.indexOf('code');
      const nameIdx = header.indexOf('name');
      const categoryIdx = header.indexOf('category');

      if (codeIdx === -1 || nameIdx === -1) {
        setImportError('CSV must include "code" and "name" columns.');
        return;
      }

      type CategoryValue = (typeof CATEGORIES)[number]['value'];
      const validCategories: readonly string[] = CATEGORIES.map((c) => c.value);

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const rawCategory = categoryIdx !== -1 ? cols[categoryIdx]?.toLowerCase() : 'other';
        return {
          organization_id: orgId,
          code: cols[codeIdx] || '',
          label: cols[nameIdx] || '',
          category: (validCategories.includes(rawCategory) ? rawCategory : 'other') as CategoryValue,
          external_source: 'import' as const,
        };
      }).filter((r) => r.code && r.label);

      if (rows.length === 0) {
        setImportError('No valid rows found in CSV.');
        return;
      }

      const { error } = await supabase.from('cost_codes').insert(rows);
      if (error) throw error;

      await useDataStore.getState().refresh();
    } catch (err) {
      console.error('CSV import failed:', err);
      setImportError('Import failed. Check your CSV format and try again.');
    } finally {
      setImporting(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-text">Cost Codes</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Manage cost codes for purchase requests and accounting</p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label className="px-4 py-2 border border-border text-text text-[12px] font-semibold rounded-lg hover:bg-surface transition-colors cursor-pointer">
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={importing}
              className="hidden"
            />
          </label>

          {/* Create button */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            {showCreate ? 'Cancel' : 'Add Cost Code'}
          </button>
        </div>
      </div>

      {/* Import error message */}
      {importError && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600 ml-4 text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white border border-border rounded-lg p-5 mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. 01-100"
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. General Labor"
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !newCode.trim() || !newName.trim()}
            className="px-5 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Cost Code'}
          </button>
        </div>
      )}

      {/* Cost Codes Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : costCodes.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[13px]">
          No cost codes yet. Add one manually or import from CSV.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Code</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Category</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Source</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {costCodes.map((cc) => (
                <tr key={cc.id} className="border-b border-border-light">
                  <td className="px-4 py-3 font-mono font-medium text-text tracking-wider">
                    {cc.code}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {cc.label}
                  </td>
                  <td className="px-4 py-3 text-text-muted capitalize">
                    {cc.category}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${SOURCE_BADGE_STYLES[cc.externalSource] || SOURCE_BADGE_STYLES.manual}`}>
                      {SOURCE_LABELS[cc.externalSource] || 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      cc.isActive
                        ? 'bg-success-soft text-success'
                        : 'bg-surface text-text-muted'
                    }`}>
                      {cc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(cc.id, cc.isActive)}
                      disabled={toggling === cc.id}
                      className={`text-[11px] hover:underline disabled:opacity-50 ${
                        cc.isActive ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {toggling === cc.id
                        ? 'Updating...'
                        : cc.isActive
                          ? 'Deactivate'
                          : 'Activate'}
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
