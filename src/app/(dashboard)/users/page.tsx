'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { createClient } from '@/lib/supabase-browser';

interface OrgUser {
  id: string;
  email: string;
  full_name: string;
  disabled: boolean;
  created_at: string;
  org_role_bindings: {
    id: string;
    org_role_id: string;
    org_roles: { name: string };
  }[];
}

interface OrgRole {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { can, profile } = useAuthStore();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [orgRoles, setOrgRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    if (!profile?.organization_id) return;

    const { data } = await supabase
      .from('profiles')
      .select(`
        id, email, full_name, disabled, created_at,
        org_role_bindings!inner (
          id, org_role_id,
          org_roles ( name )
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true });

    setUsers((data as unknown as OrgUser[]) ?? []);
    setLoading(false);
  }, [profile?.organization_id, supabase]);

  useEffect(() => {
    fetchUsers();
    supabase.from('org_roles').select('id, name').then(({ data }) => {
      setOrgRoles(data ?? []);
    });
  }, [fetchUsers, supabase]);

  const handleToggleDisabled = async (userId: string, currentDisabled: boolean) => {
    if (userId === profile?.id) return;
    const action = currentDisabled ? 'enable' : 'disable';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;

    await supabase
      .from('profiles')
      .update({ disabled: !currentDisabled })
      .eq('id', userId);
    await fetchUsers();
  };

  const handleChangeRole = async (userId: string, currentBindingId: string, newRoleId: string) => {
    if (userId === profile?.id) return;

    // Delete old binding, insert new
    await supabase.from('org_role_bindings').delete().eq('id', currentBindingId);
    await supabase.from('org_role_bindings').insert({
      user_id: userId,
      organization_id: profile?.organization_id,
      org_role_id: newRoleId,
    });
    await fetchUsers();
  };

  if (!can('org.manage_users')) {
    return (
      <div className="p-8 text-center text-text-muted text-[13px]">
        You don&apos;t have permission to manage users.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-[16px] font-semibold text-text">Users</h2>
        <p className="text-[12px] text-text-muted mt-0.5">Manage organization members and their roles</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-[13px]">
          No users in this organization yet.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Email</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Org Role</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted uppercase tracking-wider text-[10px]">Joined</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const binding = u.org_role_bindings[0];
                const isMe = u.id === profile?.id;
                return (
                  <tr key={u.id} className="border-b border-border-light">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text">{u.full_name || '—'}</span>
                      {isMe && <span className="ml-1.5 text-[10px] text-text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="text-text-muted">{binding?.org_roles?.name ?? '—'}</span>
                      ) : (
                        <select
                          value={binding?.org_role_id ?? ''}
                          onChange={(e) => handleChangeRole(u.id, binding?.id, e.target.value)}
                          className="px-2 py-1 border border-border rounded text-[11px] bg-white text-text"
                        >
                          {orgRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        u.disabled
                          ? 'bg-danger-soft text-danger'
                          : 'bg-success-soft text-success'
                      }`}>
                        {u.disabled ? 'disabled' : 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isMe && (
                        <button
                          onClick={() => handleToggleDisabled(u.id, u.disabled)}
                          className={`text-[11px] hover:underline ${u.disabled ? 'text-success' : 'text-danger'}`}
                        >
                          {u.disabled ? 'Enable' : 'Disable'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
