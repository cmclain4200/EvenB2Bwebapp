'use client';

import { create } from 'zustand';
import { createClient } from './supabase-browser';
import { useAuthStore } from './auth-store';

// ── Types (matching DB schema, camelCased for app use) ──

export type ProjectPhase = 'preconstruction' | 'foundation' | 'structural' | 'framing' | 'mep' | 'finishes' | 'closeout';
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'purchased';
export type UrgencyLevel = 'normal' | 'urgent';
export type NeedBy = 'today' | 'tomorrow' | 'this-week' | 'next-week';
export type RequestCategory = 'materials' | 'tools' | 'equipment-rental' | 'subcontract' | 'other';
export type DeliveryMethod = 'pickup' | 'delivery';

export interface Project {
  id: string;
  name: string;
  jobNumber: string;
  address: string;
  monthlyBudget: number;
  status: 'active' | 'completed' | 'on-hold';
  phase: ProjectPhase;
}

export interface CostCode {
  id: string;
  code: string;
  label: string;
  category: string;
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
}

export interface PurchaseRequest {
  id: string;
  poNumber: string;
  projectId: string;
  requesterId: string;
  vendor: string;
  category: RequestCategory;
  costCodeId: string;
  lineItems: LineItem[];
  estimatedTotal: number;
  finalTotal?: number;
  needBy: NeedBy;
  urgency: UrgencyLevel;
  notes: string;
  attachments: string[];
  receiptAttachments: string[];
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  purchasedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface AuditEntry {
  id: string;
  requestId: string;
  action: string;
  userId: string;
  timestamp: string;
  details?: string;
}

export interface BudgetSnapshot {
  projectId: string;
  monthlyBudget: number;
  approvedTotal: number;
  purchasedTotal: number;
  pendingTotal: number;
  remaining: number;
}

export interface BudgetImpact {
  currentPct: number;
  afterPct: number;
  atRisk: boolean;
  overBudget: boolean;
}

// ── Helper: convert DB row → app type ──

function dbToRequest(row: Record<string, unknown>, lineItems: Record<string, unknown>[]): PurchaseRequest {
  return {
    id: row.id as string,
    poNumber: row.po_number as string,
    projectId: row.project_id as string,
    requesterId: row.requester_id as string,
    vendor: row.vendor as string,
    category: row.category as RequestCategory,
    costCodeId: row.cost_code_id as string,
    lineItems: lineItems.map((li) => ({
      id: li.id as string,
      name: li.name as string,
      quantity: Number(li.quantity),
      unit: li.unit as string,
      estimatedUnitCost: Number(li.estimated_unit_cost),
    })),
    estimatedTotal: Number(row.estimated_total),
    finalTotal: row.final_total != null ? Number(row.final_total) : undefined,
    needBy: row.need_by as NeedBy,
    urgency: row.urgency as UrgencyLevel,
    notes: (row.notes as string) || '',
    attachments: (row.attachments as string[]) || [],
    receiptAttachments: (row.receipt_attachments as string[]) || [],
    deliveryMethod: row.delivery_method as DeliveryMethod,
    deliveryAddress: (row.delivery_address as string) || undefined,
    status: row.status as RequestStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    approvedAt: (row.approved_at as string) || undefined,
    approvedBy: (row.approved_by as string) || undefined,
    rejectedAt: (row.rejected_at as string) || undefined,
    rejectedBy: (row.rejected_by as string) || undefined,
    rejectionReason: (row.rejection_reason as string) || undefined,
    purchasedAt: (row.purchased_at as string) || undefined,
  };
}

function dbToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    jobNumber: row.job_number as string,
    address: (row.address as string) || '',
    monthlyBudget: Number(row.monthly_budget),
    status: row.status as 'active' | 'completed' | 'on-hold',
    phase: (row.phase as ProjectPhase) || 'preconstruction',
  };
}

function dbToCostCode(row: Record<string, unknown>): CostCode {
  return {
    id: row.id as string,
    code: row.code as string,
    label: row.label as string,
    category: row.category as string,
  };
}

function dbToAuditEntry(row: Record<string, unknown>): AuditEntry {
  const details = row.details as Record<string, unknown> | null;
  const action = row.action as string;
  // Normalize action names: "request.approved" → "approved"
  const shortAction = action.startsWith('request.') ? action.replace('request.', '') : action;
  return {
    id: row.id as string,
    requestId: (row.target_id as string) || '',
    action: shortAction,
    userId: (row.actor_user_id as string) || '',
    timestamp: row.created_at as string,
    details: details ? buildDetailString(shortAction, details) : undefined,
  };
}

function buildDetailString(action: string, details: Record<string, unknown>): string {
  const po = details.po_number || '';
  const vendor = details.vendor || '';
  const reason = details.rejection_reason || '';
  const total = details.estimated_total || details.final_total || '';
  switch (action) {
    case 'created': return `${po} submitted for ${vendor}`;
    case 'approved': return `${po} approved`;
    case 'rejected': return reason ? `Rejected: ${reason}` : `${po} rejected`;
    case 'purchased': return `Marked purchased – $${Number(total).toLocaleString()}`;
    default: return `${po} ${action}`;
  }
}

// ── Store ──

interface DataState {
  // Data
  requests: PurchaseRequest[];
  projects: Project[];
  costCodes: CostCode[];
  users: UserProfile[];
  auditLog: AuditEntry[];

  // State
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Init
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Mutations (via Edge Function)
  approveRequest: (requestId: string, costCodeId?: string) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
  markPurchased: (requestId: string, finalTotal: number, receiptUri?: string, notes?: string) => Promise<void>;
  addRequest: (data: {
    projectId: string;
    vendor: string;
    category: RequestCategory;
    costCodeId: string;
    lineItems: { name: string; quantity: number; unit: string; estimatedUnitCost: number }[];
    estimatedTotal: number;
    needBy: NeedBy;
    urgency: UrgencyLevel;
    notes: string;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: string;
    attachments?: string[];
  }) => Promise<PurchaseRequest | null>;
  updateRequest: (requestId: string, updates: Partial<PurchaseRequest>) => void;

  // Computed
  getBudgetSnapshot: (projectId: string) => BudgetSnapshot;
  getBudgetImpact: (projectId: string, amount: number) => BudgetImpact;
  getVendorPOCount: (vendor: string) => number;
  canCurrentUserApprove: (amount: number) => boolean;
  getRequestsByStatus: (status: RequestStatus) => PurchaseRequest[];
  getPendingRequests: () => PurchaseRequest[];
  getUserById: (id: string) => UserProfile | undefined;
  getProjectById: (id: string) => Project | undefined;
  getCostCodeById: (id: string) => CostCode | undefined;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const useDataStore = create<DataState>((set, get) => ({
  requests: [],
  projects: [],
  costCodes: [],
  users: [],
  auditLog: [],
  loading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      await get().refresh();
      set({ initialized: true });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  refresh: async () => {
    const supabase = createClient();
    const authState = useAuthStore.getState();
    const orgId = authState.organization?.id;
    if (!orgId) {
      set({ loading: false });
      return;
    }

    try {
      // Fetch all data in parallel
      const [projectsRes, costCodesRes, requestsRes, lineItemsRes, profilesRes, auditRes] = await Promise.all([
        supabase.from('projects').select('*').eq('organization_id', orgId).order('name'),
        supabase.from('cost_codes').select('*').eq('organization_id', orgId).order('code'),
        supabase.from('purchase_requests').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        supabase.from('line_items').select('*, purchase_requests!inner(organization_id)').eq('purchase_requests.organization_id', orgId),
        supabase.from('profiles').select('*').eq('organization_id', orgId),
        supabase.from('audit_log').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(200),
      ]);

      // Build line items map
      const lineItemsByRequest: Record<string, Record<string, unknown>[]> = {};
      for (const li of (lineItemsRes.data || [])) {
        const reqId = li.purchase_request_id;
        if (!lineItemsByRequest[reqId]) lineItemsByRequest[reqId] = [];
        lineItemsByRequest[reqId].push(li);
      }

      // Sort line items by sort_order
      for (const items of Object.values(lineItemsByRequest)) {
        items.sort((a, b) => (a.sort_order as number) - (b.sort_order as number));
      }

      const requests = (requestsRes.data || []).map((r) =>
        dbToRequest(r, lineItemsByRequest[r.id] || [])
      );

      const projects = (projectsRes.data || []).map(dbToProject);
      const costCodes = (costCodesRes.data || []).map(dbToCostCode);
      const auditLog = (auditRes.data || []).map(dbToAuditEntry);

      const users: UserProfile[] = (profilesRes.data || []).map((p) => ({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        role: '', // role resolved from RBAC
        avatarUrl: p.avatar_url || undefined,
      }));

      set({ requests, projects, costCodes, users, auditLog, loading: false, error: null });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  // ── Mutations ──

  approveRequest: async (requestId, costCodeId) => {
    const session = useAuthStore.getState().session;
    if (!session) return;

    const body: Record<string, unknown> = { action: 'approve', requestId };
    if (costCodeId) body.costCodeId = costCodeId;

    const res = await fetch(`${supabaseUrl}/functions/v1/manage-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to approve');
    }

    await get().refresh();
  },

  rejectRequest: async (requestId, reason) => {
    const session = useAuthStore.getState().session;
    if (!session) return;

    const res = await fetch(`${supabaseUrl}/functions/v1/manage-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reject', requestId, reason }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to reject');
    }

    await get().refresh();
  },

  markPurchased: async (requestId, finalTotal, receiptUri, notes) => {
    const session = useAuthStore.getState().session;
    if (!session) return;

    const res = await fetch(`${supabaseUrl}/functions/v1/manage-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'mark_purchased', requestId, finalTotal, receiptUri, notes }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to mark purchased');
    }

    await get().refresh();
  },

  addRequest: async (data) => {
    const supabase = createClient();
    const authState = useAuthStore.getState();
    const orgId = authState.organization?.id;
    const userId = authState.user?.id;
    if (!orgId || !userId) return null;

    // Insert purchase request
    const { data: inserted, error } = await supabase
      .from('purchase_requests')
      .insert({
        organization_id: orgId,
        project_id: data.projectId,
        requester_id: userId,
        vendor: data.vendor,
        category: data.category,
        cost_code_id: data.costCodeId,
        estimated_total: data.estimatedTotal,
        need_by: data.needBy,
        urgency: data.urgency,
        notes: data.notes,
        delivery_method: data.deliveryMethod,
        delivery_address: data.deliveryAddress || null,
        attachments: data.attachments || [],
        status: 'pending',
      })
      .select('*')
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || 'Failed to create request');
    }

    // Insert line items
    if (data.lineItems.length > 0) {
      const lineItemRows = data.lineItems.map((li, idx) => ({
        purchase_request_id: inserted.id,
        name: li.name,
        quantity: li.quantity,
        unit: li.unit,
        estimated_unit_cost: li.estimatedUnitCost,
        sort_order: idx,
      }));

      await supabase.from('line_items').insert(lineItemRows);
    }

    await get().refresh();

    return get().requests.find((r) => r.id === inserted.id) || null;
  },

  updateRequest: (requestId, updates) => {
    // Optimistic local update
    set({
      requests: get().requests.map((r) =>
        r.id === requestId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    });
  },

  // ── Computed ──

  getBudgetSnapshot: (projectId) => {
    const { requests, projects } = get();
    const project = projects.find((p) => p.id === projectId);
    const projectRequests = requests.filter((r) => r.projectId === projectId);

    const approvedTotal = projectRequests
      .filter((r) => r.status === 'approved' || r.status === 'purchased')
      .reduce((sum, r) => sum + r.estimatedTotal, 0);
    const purchasedTotal = projectRequests
      .filter((r) => r.status === 'purchased')
      .reduce((sum, r) => sum + (r.finalTotal ?? r.estimatedTotal), 0);
    const pendingTotal = projectRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + r.estimatedTotal, 0);
    const monthlyBudget = project?.monthlyBudget ?? 0;

    return {
      projectId,
      monthlyBudget,
      approvedTotal,
      purchasedTotal,
      pendingTotal,
      remaining: monthlyBudget - approvedTotal,
    };
  },

  getBudgetImpact: (projectId, amount) => {
    const snapshot = get().getBudgetSnapshot(projectId);
    const budget = snapshot.monthlyBudget;
    if (budget === 0) return { currentPct: 0, afterPct: 0, atRisk: false, overBudget: false };

    const currentPct = Math.round((snapshot.approvedTotal / budget) * 100);
    const afterPct = Math.round(((snapshot.approvedTotal + amount) / budget) * 100);
    return {
      currentPct,
      afterPct,
      atRisk: afterPct >= 80 && afterPct < 100,
      overBudget: afterPct >= 100,
    };
  },

  getVendorPOCount: (vendor) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return get().requests.filter(
      (r) => r.vendor === vendor && r.status !== 'rejected' && new Date(r.createdAt) >= thirtyDaysAgo
    ).length;
  },

  canCurrentUserApprove: (_amount) => {
    // With RBAC, approval is permission-based not limit-based
    const authState = useAuthStore.getState();
    return authState.can('request.approve');
  },

  getRequestsByStatus: (status) => get().requests.filter((r) => r.status === status),

  getPendingRequests: () =>
    get()
      .requests.filter((r) => r.status === 'pending')
      .sort((a, b) => {
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),

  getUserById: (id) => get().users.find((u) => u.id === id),
  getProjectById: (id) => get().projects.find((p) => p.id === id),
  getCostCodeById: (id) => get().costCodes.find((c) => c.id === id),
}));
