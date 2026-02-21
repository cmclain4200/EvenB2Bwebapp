'use client';

import { create } from 'zustand';
import {
  User, Project, CostCode, PurchaseRequest, AuditEntry, BudgetSnapshot, BudgetImpact,
  RequestStatus, UserRole,
} from './types';
import { USERS, PROJECTS, COST_CODES, SEED_REQUESTS, generateAuditEntries } from './seed';

interface AppState {
  // Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;

  // Data
  users: User[];
  projects: Project[];
  costCodes: CostCode[];
  requests: PurchaseRequest[];
  auditLog: AuditEntry[];

  // Actions
  approveRequest: (requestId: string, costCodeId?: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  markPurchased: (requestId: string, finalTotal: number, receiptUri?: string) => void;
  addRequest: (request: PurchaseRequest) => void;
  updateRequest: (requestId: string, updates: Partial<PurchaseRequest>) => void;

  // Computed
  getBudgetSnapshot: (projectId: string) => BudgetSnapshot;
  getBudgetImpact: (projectId: string, amount: number) => BudgetImpact;
  getVendorPOCount: (vendor: string) => number;
  canCurrentUserApprove: (amount: number) => boolean;
  getRequestsByStatus: (status: RequestStatus) => PurchaseRequest[];
  getPendingRequests: () => PurchaseRequest[];
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getCostCodeById: (id: string) => CostCode | undefined;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: USERS[2], // Sarah Chen, manager
  users: USERS,
  projects: PROJECTS,
  costCodes: COST_CODES,
  requests: [...SEED_REQUESTS],
  auditLog: generateAuditEntries(SEED_REQUESTS),

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role) => {
    const user = USERS.find((u) => u.role === role);
    if (user) set({ currentUser: user });
  },

  approveRequest: (requestId, costCodeId) => {
    const state = get();
    const now = new Date().toISOString();
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as RequestStatus,
              approvedAt: now,
              approvedBy: state.currentUser.id,
              costCodeId: costCodeId ?? r.costCodeId,
              updatedAt: now,
            }
          : r
      ),
      auditLog: [
        {
          id: `a${Date.now()}`,
          requestId,
          action: 'approved',
          userId: state.currentUser.id,
          timestamp: now,
          details: `Approved by ${state.currentUser.name}`,
        },
        ...state.auditLog,
      ],
    });
  },

  rejectRequest: (requestId, reason) => {
    const state = get();
    const now = new Date().toISOString();
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as RequestStatus,
              rejectedAt: now,
              rejectedBy: state.currentUser.id,
              rejectionReason: reason,
              updatedAt: now,
            }
          : r
      ),
      auditLog: [
        {
          id: `a${Date.now()}`,
          requestId,
          action: 'rejected',
          userId: state.currentUser.id,
          timestamp: now,
          details: `Rejected: ${reason}`,
        },
        ...state.auditLog,
      ],
    });
  },

  markPurchased: (requestId, finalTotal, receiptUri) => {
    const state = get();
    const now = new Date().toISOString();
    set({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'purchased' as RequestStatus,
              finalTotal,
              purchasedAt: now,
              receiptAttachments: receiptUri
                ? [...r.receiptAttachments, receiptUri]
                : r.receiptAttachments,
              updatedAt: now,
            }
          : r
      ),
      auditLog: [
        {
          id: `a${Date.now()}`,
          requestId,
          action: 'purchased',
          userId: state.currentUser.id,
          timestamp: now,
          details: `Marked purchased – $${finalTotal.toLocaleString()}`,
        },
        ...state.auditLog,
      ],
    });
  },

  addRequest: (request) => {
    const state = get();
    set({
      requests: [request, ...state.requests],
      auditLog: [
        {
          id: `a${Date.now()}`,
          requestId: request.id,
          action: 'submitted',
          userId: request.requesterId,
          timestamp: request.createdAt,
          details: `${request.poNumber} submitted for ${request.vendor}`,
        },
        ...state.auditLog,
      ],
    });
  },

  updateRequest: (requestId, updates) => {
    const state = get();
    set({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    });
  },

  getBudgetSnapshot: (projectId) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    const projectRequests = state.requests.filter((r) => r.projectId === projectId);

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
    const state = get();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return state.requests.filter(
      (r) => r.vendor === vendor && r.status !== 'rejected' && new Date(r.createdAt) >= thirtyDaysAgo
    ).length;
  },

  canCurrentUserApprove: (amount) => {
    const user = get().currentUser;
    if (user.approvalLimit === null) return true;
    return user.approvalLimit >= amount;
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
