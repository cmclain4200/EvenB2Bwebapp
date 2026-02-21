'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { createClient } from '@/lib/supabase-browser';

interface AccessCode {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  status: string;
  created_at: string;
  org_roles: { name: string } | null;
  project_roles: { name: string } | null;
  projects: { name: string; job_number: string } | null;
  profiles: { full_name: string } | null;
}

interface OrgRole {
  id: string;
  name: string;
}

interface ProjectRole {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  job_number: string;
}

export default function AccessCodesPage() {
  const { session, can } = useAuthStore();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [orgRoles, setOrgRoles] = useState<OrgRole[]>([]);
  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrgRole, setSelectedOrgRole] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectRole, setSelectedProjectRole] = useState('');
  const [maxUses, setMaxUses] = useState('10');
  const [expiresIn, setExpiresIn] = useState('');
  const [creating, setCreating] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const fetchCodes = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-access-codes?action=list`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setCodes(data.codes ?? []);
    } catch {
      console.error('Failed to fetch codes');
    } finally {
      setLoading(false);
    }
  }, [session, supabaseUrl]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('org_roles').select('id, name'),
      supabase.from('project_roles').select('id, name'),
      supabase.from('projects').select('id, name, job_number'),
    ]).then(([orgRes, projRoleRes, projRes]) => {
      setOrgRoles(orgRes.data ?? []);
      setProjectRoles(projRoleRes.data ?? []);
      setProjects(projRes.data ?? []);
      if (orgRes.data?.length) {
        const fieldWorkerRole = orgRes.data.find((r) => r.name === 'accounting');
        setSelectedOrgRole(fieldWorkerRole?.id ?? orgRes.data[0].id);
      }
    });
  }, []);

  const handleCreate = async () => {
    if (!session || !selectedOrgRole) return;
    setCreating(true);

    const body: Record<string, unknown> = {
      default_org_role_id: selectedOrgRole,
      max_uses: parseInt(maxUses) || 1,
    };
    if (selectedProject) body.project_id = selectedProject;
    if (selectedProjectRole) body.project_role_id = selectedProjectRole;
    if (expiresIn) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expiresIn));
      body.expires_at = d.toISOString();
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/manage-access-codes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      setShowCreate(false);
      setMaxUses('10');
      setExpiresIn('');
      setSelectedProject('');
      setSelectedProjectRole('');
      await fetchCodes();
    } catch {
      console.error('Failed to create code');
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (codeId: string) => {
    if (!session || !confirm('Disable this access code?')) return;

    await fetch(`${supabaseUrl}/functions/v1/manage-access-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'disable', code_id: codeId }),
    });
    await fetchCodes();
  };

  if (!can('org.manage_access_codes')) {
    return (
      <div className="p-8 text-center text-text-muted text-[13px]">
        You don&apos;t have permission to manage access codes.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-text">Access Codes</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Create and manage team invitation codes</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          {showCreate ? 'Cancel' : 'Create Code'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white border border-border rounded-lg p-5 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Org Role</label>
              <select
                value={selectedOrgRole}
                onChange={(e) => setSelectedOrgRole(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
              >
                {orgRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Max Uses</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Project (optional)</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.job_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Project Role</label>
              <select
                value={selectedProjectRole}
                onChange={(e) => setSelectedProjectRole(e.target.value)}
                disabled={!selectedProject}
                className="w-full px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white disabled:opacity-40"
              >
                <option value="">None</option>
                {projectRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1 uppercase tracking-wider">Expires in (days, optional)</label>
            <input
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              min="1"
              placeholder="Never"
              className="w-48 px-3 py-2 border border-border rounded-lg text-[12px] text-text bg-white"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !selectedOrgRole}
            className="px-5 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Generate Code'}
          </button>
        </div>
      )}

      {/* Codes Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[13px]">
          No access codes yet. Create one to invite team members.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Code</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Org Role</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Project</th>
                <th className="text-center px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Uses</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Created</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-border-light">
                  <td className="px-4 py-3 font-mono font-medium text-text tracking-wider">{c.code}</td>
                  <td className="px-4 py-3 text-text-muted">{c.org_roles?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {c.projects ? `${c.projects.name}` : '—'}
                    {c.project_roles ? ` (${c.project_roles.name})` : ''}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className={c.uses_count >= c.max_uses ? 'text-danger font-medium' : 'text-text'}>
                      {c.uses_count}
                    </span>
                    <span className="text-text-muted"> / {c.max_uses}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      c.status === 'active'
                        ? 'bg-success-soft text-success'
                        : 'bg-surface text-text-muted'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(c.created_at).toLocaleDateString()}
                    {c.profiles?.full_name && (
                      <span className="block text-[10px]">by {c.profiles.full_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'active' && (
                      <button
                        onClick={() => handleDisable(c.id)}
                        className="text-[11px] text-danger hover:underline"
                      >
                        Disable
                      </button>
                    )}
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
