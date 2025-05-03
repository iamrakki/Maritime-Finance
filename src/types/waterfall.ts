/**
 * Waterfall Finance System Types
 *
 * Defines the data structures for ship financing with waterfall payment distribution
 * on XRPL blockchain.
 */

// Wallet Role Types
export type WalletRole = 'charterer' | 'investor' | 'shipowner' | 'platform';

// Transaction Types
export type TransactionType =
  | 'charterer_payment'      // Charterer pays for voyage
  | 'investor_recovery'      // Payment to investor (principal + interest)
  | 'shipowner_payment'      // Remainder payment to shipowner
  | 'early_repayment'        // Shipowner early loan repayment
  | 'penalty_fee'            // Early repayment penalty
  | 'default_coverage';      // Shipowner covering charterer default

// Financing Agreement Status
export type FinancingStatus =
  | 'setup'                  // Initial configuration
  | 'active'                 // Active financing, investor not fully paid
  | 'investor_recovered'     // Investor fully paid, shipowner receiving
  | 'completed'              // All obligations settled
  | 'defaulted';             // Charterer defaulted, shipowner liable

// Payment Hook Status
export type HookStatus =
  | 'not_created'
  | 'creating'
  | 'active'
  | 'error';

// Individual Wallet Configuration
export interface WalletConfig {
  role: WalletRole;
  address: string;
  secretKey: string;          // User-provided secret key
  publicKey?: string;
  balance?: string;           // XRP balance (in drops)
  rlusdBalance?: string;      // RLUSD balance if available
  lastUpdated?: string;
}

// Transaction Record
export interface WaterfallTransaction {
  id: string;
  hash?: string;                    // XRPL transaction hash
  type: TransactionType;
  timestamp: string;

  // Transaction details
  from: string;                     // Sender address
  to: string;                       // Recipient address
  amount: string;                   // Amount in XRP drops
  amountXRP?: number;              // Amount in XRP (for display)

  // Waterfall context
  investorPortion?: string;         // Amount going to investor
  shipownerPortion?: string;        // Amount going to shipowner
  penaltyAmount?: string;           // Penalty fee if applicable

  // Status
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  errorMessage?: string;

  // XRPL details
  ledgerIndex?: number;
  fee?: string;                     // Transaction fee in drops

  // Metadata
  notes?: string;
}

// Investor Recovery Tracking
export interface InvestorRecovery {
  principal: number;                // Original loan amount (XRP)
  interestRate: number;             // Interest rate (percentage)
  interestAmount: number;           // Calculated interest (XRP)
  totalTarget: number;              // principal + interest (XRP)

  recovered: number;                // Amount recovered so far (XRP)
  remaining: number;                // Amount still owed (XRP)
  percentageRecovered: number;      // 0-100%

  isFullyRecovered: boolean;
  recoveredAt?: string;             // Timestamp when fully recovered
}

// Financing Agreement
export interface FinancingAgreement {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Loan Terms
  principal: number;                // Loan amount to shipowner (XRP)
  interestRate: number;             // Annual interest rate (%)
  expectedVoyageRevenue: number;    // Expected charterer payment (XRP)
  earlyRepaymentPenaltyRate: number; // Penalty rate for early repayment (%)

  // Parties
  wallets: {
    charterer: WalletConfig;
    investor: WalletConfig;
    shipowner: WalletConfig;
    platform: WalletConfig;
  };

  // Payment Hook (Platform Escrow)
  hook: {
    status: HookStatus;
    address?: string;               // Hook/escrow account address
    sequence?: number;              // Account sequence
    createdAt?: string;
    errorMessage?: string;
  };

  // Financial Tracking
  investorRecovery: InvestorRecovery;

  // Status
  status: FinancingStatus;

  // Transaction History
  transactions: WaterfallTransaction[];

  // Voyage Context (optional link to existing voyage)
  voyageId?: string;
  voyageNumber?: string;
  vesselName?: string;
}

// Waterfall Distribution Calculation Result
export interface WaterfallDistribution {
  totalAmount: number;              // Total payment amount (XRP)

  // Distribution breakdown
  toInvestor: number;               // Amount going to investor
  toShipowner: number;              // Amount going to shipowner
  platformFee: number;              // Platform fee (if applicable)

  // Investor status after this payment
  investorRecoveryBefore: number;
  investorRecoveryAfter: number;
  investorFullyPaid: boolean;

  // Reasoning
  calculation: {
    step: string;
    amount: number;
    recipient: WalletRole;
  }[];
}

// Early Repayment Calculation
export interface EarlyRepaymentCalculation {
  remainingDebt: number;            // Investor debt remaining
  penaltyRate: number;              // Penalty percentage
  penaltyAmount: number;            // Calculated penalty fee
  totalDue: number;                 // remainingDebt + penalty

  // Breakdown
  toInvestor: number;               // Debt payment to investor
  toPlatform: number;               // Penalty to platform
}

// Simulator State
export interface SimulatorState {
  // Configuration
  isConfigured: boolean;
  agreement?: FinancingAgreement;

  // XRPL Connection
  isConnected: boolean;
  networkUrl: string;

  // UI State
  isLoading: boolean;
  error?: string;

  // Active operations
  pendingTransaction?: WaterfallTransaction;
}

// Helper function types
export type DropToXRP = (drops: string) => number;
export type XRPToDrops = (xrp: number) => string;

// Constants
export const DROPS_PER_XRP = 1_000_000;
export const XRPL_TESTNET_URL = 'wss://xahau-test.net';
export const XRPL_TESTNET_EXPLORER = 'https://xahau-testnet.xrpl.org';
export const XRPL_TESTNET_FAUCET = 'https://xahau-test.net';

// Hook Constants
export const WATERFALL_HOOK_NAMESPACE = 'waterfall-finance-v1';

// Storage Keys
export const WATERFALL_STORAGE_KEYS = {
  agreement: (id: string) => `waterfall-agreement-${id}`,
  agreementList: 'waterfall-agreement-list',
} as const;
