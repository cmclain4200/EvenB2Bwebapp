'use client';

import { useState } from 'react';
import {
  ORG_ROLES,
  ORG_ROLE_LABELS,
  ORG_ROLE_DESCRIPTIONS,
  ORG_ROLE_PERMISSIONS,
  PROJECT_ROLES,
  PROJECT_ROLE_LABELS,
  PROJECT_ROLE_DESCRIPTIONS,
  PROJECT_ROLE_PERMISSIONS,
  OrgRole,
  ProjectRole,
} from '@/lib/rbac';

export default function RolesPage() {
  const [expandedOrg, setExpandedOrg] = useState<OrgRole | null>(null);
  const [expandedProject, setExpandedProject] = useState<ProjectRole | null>(null);

  const orgRoleKeys = Object.values(ORG_ROLES) as OrgRole[];
  const projectRoleKeys = Object.values(PROJECT_ROLES) as ProjectRole[];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-[16px] font-semibold text-text">Role Library</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          System-defined roles and their permissions. Roles cannot be edited.
        </p>
      </div>

      {/* ── Organization Roles ── */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          Organization Roles
        </h3>
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {orgRoleKeys.map((role, idx) => {
            const isExpanded = expandedOrg === role;
            const permissions = ORG_ROLE_PERMISSIONS[role];
            const isLast = idx === orgRoleKeys.length - 1;

            return (
              <div key={role} className={!isLast ? 'border-b border-border' : ''}>
                <button
                  onClick={() => setExpandedOrg(isExpanded ? null : role)}
                  className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-text">
                        {ORG_ROLE_LABELS[role]}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono bg-surface px-1.5 py-0.5 rounded">
                        {role}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {ORG_ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-0">
                    {permissions.length === 0 ? (
                      <p className="text-[12px] text-text-muted italic">
                        No org-level permissions. This role relies on project-level roles for access.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {permissions.map((perm) => (
                          <span
                            key={perm}
                            className="bg-surface text-text-muted rounded-md px-2 py-0.5 text-[10px] font-mono"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Project Roles ── */}
      <div>
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          Project Roles
        </h3>
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {projectRoleKeys.map((role, idx) => {
            const isExpanded = expandedProject === role;
            const permissions = PROJECT_ROLE_PERMISSIONS[role];
            const isLast = idx === projectRoleKeys.length - 1;

            return (
              <div key={role} className={!isLast ? 'border-b border-border' : ''}>
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : role)}
                  className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-text">
                        {PROJECT_ROLE_LABELS[role]}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono bg-surface px-1.5 py-0.5 rounded">
                        {role}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {PROJECT_ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.map((perm) => (
                        <span
                          key={perm}
                          className="bg-surface text-text-muted rounded-md px-2 py-0.5 text-[10px] font-mono"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
