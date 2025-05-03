// Voyage Management Data Models

export type MilestoneType =
  | 'port_departure'
  | 'port_arrival'
  | 'route_segment'
  | 'critical_waypoint'
  | 'custom';

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_verification'
  | 'verified'
  | 'disputed';

export type VoyageStatus =
  | 'draft'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VerifierType =
  | 'port_authority'
  | 'inspector'
  | 'agent'
  | 'automated'
  | 'custom';

export type EvidenceType =
  | 'document'
  | 'ais_data'
  | 'gps'
  | 'sensor'
  | 'witness'
  | 'automated';

// AIS (Automatic Identification System) Data
export interface AISData {
  position: [number, number]; // [latitude, longitude]
  speed: number; // knots
  heading: number; // degrees (0-360)
  timestamp: string; // ISO timestamp
  mmsi?: string; // Maritime Mobile Service Identity
  navigationStatus?: string;
}

// Document attachment
export interface DocumentAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  url?: string; // URL or base64
  uploadedAt: string;
  uploadedBy?: string;
}

// Attestation - Platform verification record
export interface Attestation {
  id: string;
  milestoneId: string;
  voyageId: string;

  // Verifier details
  verifierId: string;
  verifierName: string;
  verifierType: VerifierType;
  verifierOrganization?: string;
  verifierContact?: string;

  // Attestation data
  timestamp: string;
  verifiedAt: string;

  // Evidence submitted
  evidenceType: EvidenceType;
  aisData?: AISData;
  documents: DocumentAttachment[];
  notes?: string;

  // Platform verification
  platformVerified: boolean;
  platformTimestamp: string;
  signedHash: string; // Platform-generated verification hash

  // Status
  status: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

// Milestone
export interface Milestone {
  id: string;
  voyageId: string;

  // Milestone details
  type: MilestoneType;
  name: string;
  description?: string;

  // Scheduling
  scheduledDate?: string;
  actualDate?: string;
  estimatedDate?: string;

  // Geolocation
  coordinates?: [number, number];
  locationName?: string;

  // Progress tracking
  status: MilestoneStatus;
  progressPercentage?: number; // For route segments (25%, 50%, 75%)

  // Verification requirements
  requiresVerification: boolean;
  verifierAssigned?: string;
  verifierName?: string;
  verificationLink?: string; // Public URL for verification

  // Attestation
  attestationId?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  // Dependencies
  dependsOn?: string[]; // IDs of prerequisite milestones
  blockedBy?: string[]; // IDs of milestones blocking this one

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;

  // AIS data at milestone (simulated)
  aisSnapshot?: AISData;
}

// Voyage
export interface Voyage {
  id: string;
  voyageNumber: string;

  // Parties
  shipownerId: string;
  shipownerName: string;
  shipownerCompany?: string;
  chartererId: string;
  chartererName: string;
  chartererCompany?: string;

  // Vessel details
  vesselName: string;
  vesselIMO?: string;
  vesselMMSI?: string;
  vesselType?: string;
  vesselFlag?: string;

  // Route information
  origin: {
    name: string;
    code?: string; // Port code (e.g., SGSIN)
    coordinates: [number, number];
  };
  destination: {
    name: string;
    code?: string;
    coordinates: [number, number];
  };
  routeName: string; // e.g., "Singapore-Rotterdam via Suez"
  routeCoordinates: [number, number][]; // Full route path
  totalDistance: number; // Nautical miles

  // Timing
  scheduledDeparture: string;
  actualDeparture?: string;
  estimatedArrival: string;
  actualArrival?: string;
  durationDays: number;

  // Status & Progress
  status: VoyageStatus;
  currentProgress: number; // 0-100 percentage
  currentPosition?: [number, number];
  currentSpeed?: number; // knots
  currentHeading?: number; // degrees

  // Real-time AIS data
  currentAIS?: AISData;
  lastAISUpdate?: string;

  // Milestones
  milestones: Milestone[];
  milestonesCompleted: number;
  milestonesTotal: number;
  nextMilestone?: {
    id: string;
    name: string;
    eta: string;
    distance: number; // nm remaining
  };

  // Financial
  contractValue: number;
  currency: 'USD' | 'RLUSD';
  invoiceIds: string[]; // References to linked invoices

  // Risk & Scoring
  terScore?: number; // Transportation Equity Rating
  riskLevel?: 'Very Low' | 'Low' | 'Medium' | 'High';
  creditScore?: number;

  // Charter party details
  charterPartyType?: 'voyage' | 'time' | 'bareboat';
  cargoType?: string;
  cargoQuantity?: number;
  cargoUnit?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Simulation flags
  simulationActive?: boolean;
  simulationSpeed?: number; // Multiplier for demo
}

// Voyage Invoice (extends base invoice)
export interface VoyageInvoice {
  id: string;
  invoiceNumber: string;

  // Voyage linkage
  voyageId: string;
  voyageNumber: string;

  // Parties (auto-filled from voyage)
  shipowner: {
    name: string;
    company?: string;
    address?: string;
    contact?: string;
  };
  charterer: {
    name: string;
    company?: string;
    address?: string;
    contact?: string;
  };

  // Vessel context
  vessel: string;
  route: string;

  // Invoice details
  invoiceDate: string;
  dueDate: string;

  // Billing structure
  billingType: 'voyage_total' | 'milestone_based' | 'hybrid';

  // Milestone-based line items (for transparency)
  milestoneReferences?: {
    milestoneId: string;
    milestoneName: string;
    milestoneStatus: MilestoneStatus;
    amount: number;
    description: string;
  }[];

  // Standard line items
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    total: number;
    milestoneId?: string; // Optional reference
  }[];

  // Amounts
  subtotal: number;
  discount: number;
  discountLabel?: string;
  tax?: number;
  grandTotal: number;

  // Payment
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentLink: string;
  paidAt?: string;
  paidBy?: string; // Wallet address
  paidAmount?: number;
  transactionHash?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Voyage Document
export interface VoyageDocument {
  id: string;
  voyageId: string;

  type: 'charter_party' | 'bill_of_lading' | 'manifest' | 'customs' | 'certificate' | 'other';
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;

  uploadedAt: string;
  uploadedBy: string;
}

// Predefined Routes (matching MapView.tsx)
export interface PredefinedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  waypoints: [number, number][];
  distance: number; // Nautical miles
  estimatedDays: number;
  criticalWaypoints: {
    name: string;
    coordinates: [number, number];
    description?: string;
  }[];
}

// localStorage helper functions
export const STORAGE_KEYS = {
  voyage: (id: string) => `voyage-${id}`,
  milestone: (id: string) => `milestone-${id}`,
  attestation: (id: string) => `attestation-${id}`,
  voyageInvoice: (id: string) => `voyage-invoice-${id}`,
  voyageDoc: (id: string) => `voyage-doc-${id}`,
  voyageList: 'voyage-list',
  predefinedRoutes: 'predefined-routes',
} as const;
