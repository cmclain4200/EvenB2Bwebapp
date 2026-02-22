// ── RBAC Constants ──────────────────────────────────────────
// Canonical roles, permissions, and role-to-permission mappings.
// Used by both frontend (UI gating) and referenced by backend (enforcement).
// Roles and permissions are system-defined. Companies cannot edit them.
// Companies CAN create display titles (aliases) mapped to canonical roles.

// ── Org Roles ──

export const ORG_ROLES = {
  OWNER: 'owner',
  ORG_ADMIN: 'org_admin',
  ACCOUNTING_ADMIN: 'accounting_admin',
  READ_ONLY_AUDITOR: 'read_only_auditor',
  MEMBER: 'member',
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  org_admin: 'Org Admin',
  accounting_admin: 'Accounting Admin',
  read_only_auditor: 'Read-Only Auditor',
  member: 'Member',
};

export const ORG_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  owner: 'Full access to all organization settings, billing, and data',
  org_admin: 'Manages users, access codes, and settings (everything except billing)',
  accounting_admin: 'Audit trail, exports, integrations, and access codes',
  read_only_auditor: 'View-only access to audit trail and exports',
  member: 'Basic membership with no org-level permissions',
};

// Ordered from most to least privileged (used for escalation checks)
export const ORG_ROLE_HIERARCHY: OrgRole[] = [
  'owner', 'org_admin', 'accounting_admin', 'read_only_auditor', 'member',
];

// ── Project Roles ──

export const PROJECT_ROLES = {
  PROJECT_ADMIN: 'project_admin',
  PROJECT_MANAGER: 'project_manager',
  PROJECT_ENGINEER: 'project_engineer',
  SUPERINTENDENT: 'superintendent',
  ASSISTANT_SUPERINTENDENT: 'assistant_superintendent',
  FOREMAN: 'foreman',
  FIELD_WORKER: 'field_worker',
  ACCOUNTING_PROJECT: 'accounting_project',
  VIEWER: 'viewer',
} as const;

export type ProjectRole = (typeof PROJECT_ROLES)[keyof typeof PROJECT_ROLES];

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  project_admin: 'Project Admin',
  project_manager: 'Project Manager',
  project_engineer: 'Project Engineer',
  superintendent: 'Superintendent',
  assistant_superintendent: 'Assistant Superintendent',
  foreman: 'Foreman',
  field_worker: 'Field Worker',
  accounting_project: 'Project Accounting',
  viewer: 'Viewer',
};

export const PROJECT_ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  project_admin: 'Full project control including settings, members, and all proposals',
  project_manager: 'Manages settings, approves, finalizes, exports',
  project_engineer: 'Creates proposals, views budget and all proposals',
  superintendent: 'Approves proposals, views budget',
  assistant_superintendent: 'Creates proposals, views all proposals',
  foreman: 'Creates proposals, views all proposals',
  field_worker: 'Creates proposals, views only own proposals',
  accounting_project: 'Finalizes, exports, manages integration syncs',
  viewer: 'Read-only access to project data and budget',
};

// Ordered from most to least privileged
export const PROJECT_ROLE_HIERARCHY: ProjectRole[] = [
  'project_admin', 'project_manager', 'superintendent', 'project_engineer',
  'assistant_superintendent', 'foreman', 'accounting_project', 'field_worker', 'viewer',
];

// Legacy roles (still in DB, still functional, but not shown in new UI)
export const LEGACY_PROJECT_ROLES = ['approver', 'purchaser'] as const;

// ── Org Permissions ──

export const ORG_PERMISSIONS = {
  MANAGE_SETTINGS: 'org.manage_settings',
  MANAGE_BILLING: 'org.manage_billing',
  MANAGE_ACCESS_CODES: 'org.manage_access_codes',
  MANAGE_USERS: 'org.manage_users',
  VIEW_AUDIT_TRAIL: 'org.view_audit_trail',
  VIEW_AUDIT_LOG: 'org.view_audit_log',
  EXPORT_ALL: 'org.export_all',
  MANAGE_INTEGRATIONS: 'org.manage_integrations',
  FINANCE_MANAGE_COST_CODES: 'finance.manage_cost_codes',
  FINANCE_MANAGE_VENDORS: 'finance.manage_vendors',
  FINANCE_IMPORT_COST_CODES: 'finance.import_cost_codes',
  FINANCE_IMPORT_VENDORS: 'finance.import_vendors',
} as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[keyof typeof ORG_PERMISSIONS];

// ── Project Permissions ──

export const PROJECT_PERMISSIONS = {
  VIEW: 'project.view',
  MANAGE_SETTINGS: 'project.manage_settings',
  MANAGE_MEMBERS: 'project.manage_members',
  VIEW_BUDGET: 'project.view_budget',
  EDIT_BUDGET: 'project.edit_budget',
  PROPOSAL_CREATE: 'proposal.create',
  PROPOSAL_APPROVE: 'proposal.approve',
  PROPOSAL_OVERRIDE_APPROVAL: 'proposal.override_approval',
  PROPOSAL_FINALIZE: 'proposal.finalize',
  PROPOSAL_EDIT_OTHERS: 'proposal.edit_others',
  PROPOSAL_DELETE: 'proposal.delete',
  PROPOSAL_VIEW_ALL: 'proposal.view_all',
  PROPOSAL_VIEW_OWN_ONLY: 'proposal.view_own_only',
  EXPORT_PROJECT: 'export.project',
  INTEGRATION_RETRY_SYNC: 'integration.retry_sync',
  AUDIT_VIEW_PROJECT: 'audit.view_project',
  FINANCE_EDIT_PROPOSAL_CODING: 'finance.edit_proposal_coding',
  FINANCE_REQUIREMENTS_MANAGE: 'finance.requirements_manage',
  // Legacy backward-compat keys (still in DB)
  REQUEST_APPROVE: 'request.approve',
  REQUEST_DENY: 'request.deny',
  REQUEST_CREATE: 'request.create',
  PO_MARK_ORDERED: 'po.mark_ordered',
} as const;

export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[keyof typeof PROJECT_PERMISSIONS];

// ── Role → Permission Mappings (mirrors DB, used for client-side reference) ──

export const ORG_ROLE_PERMISSIONS: Record<OrgRole, OrgPermission[]> = {
  owner: Object.values(ORG_PERMISSIONS),
  org_admin: Object.values(ORG_PERMISSIONS).filter((p) => p !== 'org.manage_billing'),
  accounting_admin: [
    'org.view_audit_trail', 'org.view_audit_log', 'org.export_all', 'org.manage_integrations',
    'org.manage_access_codes', 'finance.manage_cost_codes', 'finance.manage_vendors',
    'finance.import_cost_codes', 'finance.import_vendors',
  ],
  read_only_auditor: ['org.view_audit_trail', 'org.view_audit_log', 'org.export_all'],
  member: [],
};

export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  project_admin: Object.values(PROJECT_PERMISSIONS),
  project_manager: [
    'project.view', 'project.manage_settings', 'project.view_budget',
    'proposal.create', 'proposal.approve', 'proposal.finalize',
    'proposal.view_all', 'export.project', 'audit.view_project',
    'finance.edit_proposal_coding', 'request.approve', 'po.mark_ordered',
  ],
  project_engineer: [
    'project.view', 'project.view_budget',
    'proposal.create', 'proposal.view_all',
  ],
  superintendent: [
    'project.view', 'project.view_budget',
    'proposal.create', 'proposal.approve', 'proposal.view_all',
    'finance.edit_proposal_coding', 'request.approve',
  ],
  assistant_superintendent: [
    'project.view', 'proposal.create', 'proposal.view_all',
  ],
  foreman: [
    'project.view', 'proposal.create', 'proposal.view_all',
  ],
  field_worker: [
    'project.view', 'proposal.create', 'proposal.view_own_only',
  ],
  accounting_project: [
    'project.view', 'project.view_budget',
    'proposal.view_all', 'proposal.finalize',
    'export.project', 'integration.retry_sync', 'audit.view_project',
    'finance.edit_proposal_coding', 'po.mark_ordered',
  ],
  viewer: [
    'project.view', 'proposal.view_all', 'project.view_budget',
  ],
};

// ── Access Code Escalation Prevention ──

/** Returns the max org role a user with `issuerRole` can assign via access codes */
export function maxAssignableOrgRole(issuerRole: OrgRole): OrgRole[] {
  const idx = ORG_ROLE_HIERARCHY.indexOf(issuerRole);
  // Can assign same level or below (owner can assign anything, member can assign nothing)
  return ORG_ROLE_HIERARCHY.slice(idx);
}

/** Returns true if the assigner is allowed to issue this role */
export function canAssignOrgRole(issuerRole: OrgRole, targetRole: OrgRole): boolean {
  return maxAssignableOrgRole(issuerRole).includes(targetRole);
}

/** Project admins can generate project-only codes. Org admins can assign any project role. */
export function canAssignProjectRole(issuerOrgRole: OrgRole, _issuerProjectRole?: string): boolean {
  return ['owner', 'org_admin'].includes(issuerOrgRole) || _issuerProjectRole === 'project_admin';
}
