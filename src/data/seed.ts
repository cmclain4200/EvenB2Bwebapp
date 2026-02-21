import {
  User, Project, CostCode, PurchaseRequest, AuditEntry,
} from './types';

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const USERS: User[] = [
  { id: 'u1', name: 'Mike Torres', email: 'mike@evenconstruction.com', role: 'worker', approvalLimit: 0 },
  { id: 'u2', name: 'Jake Patterson', email: 'jake@evenconstruction.com', role: 'worker', approvalLimit: 0 },
  { id: 'u3', name: 'Sarah Chen', email: 'sarah@evenconstruction.com', role: 'manager', approvalLimit: 5000 },
  { id: 'u4', name: 'Tom Bradley', email: 'tom@evenconstruction.com', role: 'admin', approvalLimit: 25000 },
  { id: 'u5', name: 'Luis Ramirez', email: 'luis@evenconstruction.com', role: 'worker', approvalLimit: 0 },
  { id: 'u6', name: 'Ryan Patel', email: 'ryan@evenconstruction.com', role: 'worker', approvalLimit: 0 },
  { id: 'u7', name: 'Sarah Lin', email: 'slin@evenconstruction.com', role: 'worker', approvalLimit: 0 },
];

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Riverside Office Build',
    jobNumber: 'JOB-2024-0847',
    address: '1200 River Rd, Austin TX 78701',
    monthlyBudget: 85000,
    status: 'active',
    phase: 'framing',
  },
  {
    id: 'p2',
    name: 'Oakmont Retail TI',
    jobNumber: 'JOB-2024-0912',
    address: '450 Oakmont Blvd, Round Rock TX 78664',
    monthlyBudget: 42000,
    status: 'active',
    phase: 'foundation',
  },
  {
    id: 'p3',
    name: 'Cedar Park Municipal',
    jobNumber: 'JOB-2025-0103',
    address: '800 Discovery Blvd, Cedar Park TX 78613',
    monthlyBudget: 120000,
    status: 'active',
    phase: 'mep',
  },
];

// ──────────────────────────────────────────────
// Cost Codes (CSI MasterFormat)
// ──────────────────────────────────────────────
export const COST_CODES: CostCode[] = [
  { id: 'cc1', code: '03-1000', label: 'Concrete Formwork', category: 'Concrete' },
  { id: 'cc2', code: '03-3000', label: 'Cast-in-Place Concrete', category: 'Concrete' },
  { id: 'cc3', code: '05-1200', label: 'Structural Steel Framing', category: 'Metals' },
  { id: 'cc4', code: '06-1000', label: 'Rough Carpentry', category: 'Wood & Plastics' },
  { id: 'cc5', code: '07-2100', label: 'Thermal Insulation', category: 'Thermal & Moisture' },
  { id: 'cc6', code: '09-2100', label: 'Plaster & Gypsum Board', category: 'Finishes' },
  { id: 'cc7', code: '09-9000', label: 'Painting & Coating', category: 'Finishes' },
  { id: 'cc8', code: '22-1100', label: 'Facility Water Distribution', category: 'Plumbing' },
  { id: 'cc9', code: '26-0500', label: 'Common Work — Electrical', category: 'Electrical' },
  { id: 'cc10', code: '01-5000', label: 'Temporary Facilities & Controls', category: 'General Requirements' },
  { id: 'cc11', code: '31-2000', label: 'Earth Moving', category: 'Earthwork' },
  { id: 'cc12', code: '08-1100', label: 'Metal Doors & Frames', category: 'Openings' },
];

// ──────────────────────────────────────────────
// Purchase Requests
// ──────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function minutesAgo(n: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
}

export const SEED_REQUESTS: PurchaseRequest[] = [
  // ── Pending ────────────────────────────────
  {
    id: 'r1',
    poNumber: 'PO-1041',
    projectId: 'p1',
    requesterId: 'u6',
    vendor: 'ACE',
    category: 'materials',
    costCodeId: 'cc4',
    lineItems: [
      { id: 'li1', name: '2x6x16 SPF #2', quantity: 60, unit: 'pcs', estimatedUnitCost: 9.83 },
      { id: 'li2', name: 'Simpson Strong-Tie H2.5A', quantity: 40, unit: 'pcs', estimatedUnitCost: 5.01 },
    ],
    estimatedTotal: 790.00,
    needBy: 'today',
    urgency: 'normal',
    notes: 'Second floor framing crew needs material by end of day. Running short on studs.',
    attachments: ['/mock/quote-ace.pdf'],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '1200 River Rd, Austin TX 78701',
    status: 'pending',
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'r2',
    poNumber: 'PO-1042',
    projectId: 'p1',
    requesterId: 'u2',
    vendor: 'Sunbelt Rentals',
    category: 'equipment-rental',
    costCodeId: 'cc10',
    lineItems: [
      { id: 'li3', name: 'Scissor Lift 26ft — 1 week', quantity: 1, unit: 'week', estimatedUnitCost: 875.00 },
    ],
    estimatedTotal: 875.00,
    needBy: 'tomorrow',
    urgency: 'normal',
    notes: 'For ceiling rough-in on 2nd floor. Need for full week starting Monday.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '1200 River Rd, Austin TX 78701',
    status: 'pending',
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'r3',
    poNumber: 'PO-1043',
    projectId: 'p2',
    requesterId: 'u5',
    vendor: 'Home Depot Pro',
    category: 'materials',
    costCodeId: 'cc6',
    lineItems: [
      { id: 'li4', name: '5/8" Drywall 4x8', quantity: 120, unit: 'sheets', estimatedUnitCost: 14.25 },
      { id: 'li5', name: 'Drywall Screws 1-5/8"', quantity: 10, unit: 'boxes', estimatedUnitCost: 8.30 },
      { id: 'li6', name: 'Joint Compound 5gal', quantity: 8, unit: 'buckets', estimatedUnitCost: 16.00 },
    ],
    estimatedTotal: 1921.00,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Starting drywall on retail space A. Quote attached from HD Pro desk.',
    attachments: ['/mock/quote-hdpro.pdf'],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '450 Oakmont Blvd, Round Rock TX 78664',
    status: 'pending',
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'r4',
    poNumber: 'PO-1044',
    projectId: 'p2',
    requesterId: 'u7',
    vendor: 'Lowes',
    category: 'materials',
    costCodeId: 'cc3',
    lineItems: [
      { id: 'li7', name: 'Hex Bolts 3/4"x6"', quantity: 200, unit: 'pcs', estimatedUnitCost: 2.15 },
      { id: 'li8', name: 'Structural Washers 3/4"', quantity: 200, unit: 'pcs', estimatedUnitCost: 0.85 },
      { id: 'li9', name: 'Heavy Hex Nuts 3/4"', quantity: 200, unit: 'pcs', estimatedUnitCost: 0.95 },
    ],
    estimatedTotal: 790.00,
    needBy: 'today',
    urgency: 'urgent',
    notes: 'Steel erection crew on site, running low on connection hardware.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'pickup',
    status: 'pending',
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'r5',
    poNumber: 'PO-1045',
    projectId: 'p3',
    requesterId: 'u1',
    vendor: 'Fastenal',
    category: 'materials',
    costCodeId: 'cc3',
    lineItems: [
      { id: 'li10', name: 'Anchor Bolts 5/8"x10"', quantity: 100, unit: 'pcs', estimatedUnitCost: 4.95 },
      { id: 'li11', name: 'Hex Cap Screws 1/2"x3"', quantity: 150, unit: 'pcs', estimatedUnitCost: 1.97 },
    ],
    estimatedTotal: 790.00,
    needBy: 'today',
    urgency: 'urgent',
    notes: 'Steel erection crew needs connection hardware ASAP.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'pickup',
    status: 'pending',
    createdAt: minutesAgo(30),
    updatedAt: minutesAgo(30),
  },

  // ── Approved ───────────────────────────────
  {
    id: 'r6',
    poNumber: 'PO-1046',
    projectId: 'p1',
    requesterId: 'u1',
    vendor: 'ABC Supply',
    category: 'materials',
    costCodeId: 'cc5',
    lineItems: [
      { id: 'li13', name: 'R-19 Batt Insulation', quantity: 20, unit: 'rolls', estimatedUnitCost: 42.00 },
    ],
    estimatedTotal: 840.00,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Insulation for exterior walls, Building A.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '1200 River Rd, Austin TX 78701',
    status: 'approved',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    approvedAt: daysAgo(1),
    approvedBy: 'u3',
  },
  {
    id: 'r7',
    poNumber: 'PO-1047',
    projectId: 'p3',
    requesterId: 'u5',
    vendor: 'Graybar Electric',
    category: 'materials',
    costCodeId: 'cc9',
    lineItems: [
      { id: 'li14', name: '12/2 Romex 250ft', quantity: 8, unit: 'rolls', estimatedUnitCost: 128.00 },
      { id: 'li15', name: 'Single Gang Boxes', quantity: 100, unit: 'pcs', estimatedUnitCost: 1.25 },
      { id: 'li16', name: '20A Breakers', quantity: 24, unit: 'pcs', estimatedUnitCost: 8.75 },
    ],
    estimatedTotal: 1359.00,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Electrical rough-in, Phase 2 wing.',
    attachments: ['/mock/graybar-quote.pdf'],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '800 Discovery Blvd, Cedar Park TX 78613',
    status: 'approved',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    approvedAt: daysAgo(2),
    approvedBy: 'u3',
  },
  {
    id: 'r11',
    poNumber: 'PO-1051',
    projectId: 'p3',
    requesterId: 'u5',
    vendor: 'Fastenal',
    category: 'materials',
    costCodeId: 'cc3',
    lineItems: [
      { id: 'li24', name: 'Anchor Bolts 1/2"x8"', quantity: 150, unit: 'pcs', estimatedUnitCost: 3.50 },
      { id: 'li25', name: 'Wedge Anchors 3/8"x3"', quantity: 200, unit: 'pcs', estimatedUnitCost: 1.85 },
    ],
    estimatedTotal: 895.00,
    finalTotal: 895.00,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Anchor hardware for mechanical equipment pads.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'pickup',
    status: 'purchased',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    approvedAt: daysAgo(5),
    approvedBy: 'u3',
    purchasedAt: daysAgo(4),
  },

  // ── Rejected ───────────────────────────────
  {
    id: 'r8',
    poNumber: 'PO-1048',
    projectId: 'p2',
    requesterId: 'u2',
    vendor: 'United Rentals',
    category: 'equipment-rental',
    costCodeId: 'cc10',
    lineItems: [
      { id: 'li17', name: 'Mini Excavator CAT 303 — 1 month', quantity: 1, unit: 'month', estimatedUnitCost: 4500.00 },
    ],
    estimatedTotal: 4500.00,
    needBy: 'next-week',
    urgency: 'normal',
    notes: 'For parking lot grading.',
    attachments: [],
    receiptAttachments: [],
    deliveryMethod: 'delivery',
    deliveryAddress: '450 Oakmont Blvd, Round Rock TX 78664',
    status: 'rejected',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    rejectedAt: daysAgo(3),
    rejectedBy: 'u3',
    rejectionReason: 'Over budget for this phase. Re-submit after Phase 1 closeout. Consider 2-week rental instead of full month.',
  },

  // ── Purchased ──────────────────────────────
  {
    id: 'r9',
    poNumber: 'PO-1049',
    projectId: 'p1',
    requesterId: 'u1',
    vendor: 'Sherwin-Williams',
    category: 'materials',
    costCodeId: 'cc7',
    lineItems: [
      { id: 'li18', name: 'ProMar 200 Interior Flat 5gal', quantity: 6, unit: 'buckets', estimatedUnitCost: 98.00 },
      { id: 'li19', name: 'Primer 5gal', quantity: 4, unit: 'buckets', estimatedUnitCost: 72.00 },
      { id: 'li20', name: 'Roller Covers 9"', quantity: 24, unit: 'pcs', estimatedUnitCost: 4.50 },
    ],
    estimatedTotal: 984.00,
    finalTotal: 1012.47,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Paint for common areas, Phase 1.',
    attachments: ['/mock/sw-quote.pdf'],
    receiptAttachments: ['/mock/receipt-sw.pdf'],
    deliveryMethod: 'pickup',
    status: 'purchased',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
    approvedAt: daysAgo(6),
    approvedBy: 'u3',
    purchasedAt: daysAgo(5),
  },
  {
    id: 'r10',
    poNumber: 'PO-1050',
    projectId: 'p3',
    requesterId: 'u5',
    vendor: 'HD Supply',
    category: 'materials',
    costCodeId: 'cc4',
    lineItems: [
      { id: 'li21', name: '2x6x16 SPF #2', quantity: 200, unit: 'pcs', estimatedUnitCost: 9.85 },
      { id: 'li22', name: '2x4x8 SPF Stud', quantity: 300, unit: 'pcs', estimatedUnitCost: 4.25 },
      { id: 'li23', name: 'Simpson Strong-Tie A35', quantity: 100, unit: 'pcs', estimatedUnitCost: 1.65 },
    ],
    estimatedTotal: 3410.00,
    finalTotal: 3387.50,
    needBy: 'this-week',
    urgency: 'normal',
    notes: 'Framing lumber for interior partitions, Building B.',
    attachments: [],
    receiptAttachments: ['/mock/receipt-hdsupply.pdf'],
    deliveryMethod: 'delivery',
    deliveryAddress: '800 Discovery Blvd, Cedar Park TX 78613',
    status: 'purchased',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
    approvedAt: daysAgo(9),
    approvedBy: 'u3',
    purchasedAt: daysAgo(7),
  },
];

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────
export function generateAuditEntries(requests: PurchaseRequest[]): AuditEntry[] {
  const entries: AuditEntry[] = [];
  let counter = 1;

  for (const r of requests) {
    entries.push({
      id: `a${counter++}`,
      requestId: r.id,
      action: 'submitted',
      userId: r.requesterId,
      timestamp: r.createdAt,
      details: `${r.poNumber} submitted — ${r.vendor} — $${r.estimatedTotal.toLocaleString()}`,
    });

    if (r.status === 'approved' || r.status === 'purchased') {
      entries.push({
        id: `a${counter++}`,
        requestId: r.id,
        action: 'approved',
        userId: r.approvedBy!,
        timestamp: r.approvedAt!,
        details: `${r.poNumber} approved — $${r.estimatedTotal.toLocaleString()}`,
      });
    }

    if (r.status === 'rejected') {
      entries.push({
        id: `a${counter++}`,
        requestId: r.id,
        action: 'rejected',
        userId: r.rejectedBy!,
        timestamp: r.rejectedAt!,
        details: `${r.poNumber} rejected — ${r.rejectionReason}`,
      });
    }

    if (r.status === 'purchased') {
      entries.push({
        id: `a${counter++}`,
        requestId: r.id,
        action: 'purchased',
        userId: r.requesterId,
        timestamp: r.purchasedAt!,
        details: `${r.poNumber} purchased — ${r.vendor} — final $${(r.finalTotal ?? r.estimatedTotal).toLocaleString()}`,
      });
    }
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
