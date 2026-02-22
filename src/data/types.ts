// ──────────────────────────────────────────────
// Approcure – Shared Types
// ──────────────────────────────────────────────

export type UserRole = 'worker' | 'manager' | 'admin';

export type ProjectPhase = 'preconstruction' | 'foundation' | 'structural' | 'framing' | 'mep' | 'finishes' | 'closeout';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  approvalLimit: number | null; // null = unlimited, 0 = cannot approve
}

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

export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'purchased';
export type UrgencyLevel = 'normal' | 'urgent';
export type NeedBy = 'today' | 'tomorrow' | 'this-week' | 'next-week';
export type RequestCategory = 'materials' | 'tools' | 'equipment-rental' | 'subcontract' | 'other';
export type DeliveryMethod = 'pickup' | 'delivery';

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

export interface AuditEntry {
  id: string;
  requestId: string;
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'purchased' | 'updated';
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
