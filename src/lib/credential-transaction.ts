/**
 * Credential Transaction Builders
 * Creates CredentialCreate and CredentialAccept transactions for XLS-40/XLS-70
 */

import { toHex } from './hex-utils';

export interface CredentialCompanyInfo {
  companyName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  contactEmail: string;
}

export interface CredentialData {
  userAddress: string;
  issuerAddress: string;
  companyInfo: CredentialCompanyInfo;
  ipfsCid: string;
}

export interface CredentialCreateTransaction {
  TransactionType: 'CredentialCreate';
  Account: string;
  Subject: string;
  CredentialType: string;
  URI?: string;
  Fee: string;
}

export interface CredentialAcceptTransaction {
  TransactionType: 'CredentialAccept';
  Account: string;
  Issuer: string;
  CredentialType: string;
  Fee?: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  SigningPubKey?: string;
}

/**
 * Get the hex-encoded credential type for KYC
 * This is consistent across all credential transactions
 * IMPORTANT: Must match exactly between CredentialCreate and CredentialAccept
 */
export function getKYCCredentialType(): string {
  return toHex('KYC');
}

/**
 * Build CredentialCreate transaction (issuer signs)
 *
 * @param data - Credential data including user address, company info, and IPFS CID
 * @returns CredentialCreate transaction ready for issuer signing
 */
export function buildCredentialCreateTransaction(
  data: CredentialData
): CredentialCreateTransaction {
  // Encode credential type
  const credentialType = getKYCCredentialType();

  // Build IPFS URI and encode to hex
  const ipfsUri = `ipfs://${data.ipfsCid}`;
  const uriHex = toHex(ipfsUri);

  console.log('[CredentialCreate] Building transaction:', {
    issuer: data.issuerAddress,
    subject: data.userAddress,
    credentialType: 'KYC',
    credentialTypeHex: credentialType,
    uri: ipfsUri,
    uriHex: uriHex,
  });

  // Note: XLS-70 CredentialCreate only supports: Account, Subject, CredentialType, URI
  // The Data field is NOT part of the spec - use URI to point to off-chain data
  return {
    TransactionType: 'CredentialCreate',
    Account: data.issuerAddress,
    Subject: data.userAddress,
    CredentialType: credentialType,
    URI: uriHex,
    Fee: '12',
  };
}

/**
 * Build CredentialAccept transaction (user signs via Crossmark)
 *
 * @param userAddress - User's wallet address (signs and accepts)
 * @param issuerAddress - Platform issuer address
 * @returns CredentialAccept transaction ready for user signing
 */
export function buildCredentialAcceptTransaction(
  userAddress: string,
  issuerAddress: string
): CredentialAcceptTransaction {
  const credentialType = getKYCCredentialType();

  console.log('[CredentialAccept] Building transaction:', {
    user: userAddress,
    issuer: issuerAddress,
    credentialTypeHex: credentialType,
  });

  return {
    TransactionType: 'CredentialAccept',
    Account: userAddress,
    Issuer: issuerAddress,
    CredentialType: credentialType,
    // Fee: '12', // Removed as Crossmark handles this
  };
}

/**
 * Validate CredentialCreate transaction structure
 */
export function validateCredentialCreate(
  tx: CredentialCreateTransaction
): boolean {
  if (tx.TransactionType !== 'CredentialCreate') {
    console.error('[Validate] Invalid TransactionType:', tx.TransactionType);
    return false;
  }

  if (!tx.Account) {
    console.error('[Validate] Missing Account (issuer)');
    return false;
  }

  if (!tx.Subject) {
    console.error('[Validate] Missing Subject (user)');
    return false;
  }

  if (!tx.CredentialType) {
    console.error('[Validate] Missing CredentialType');
    return false;
  }

  // Validate XRPL address format
  const addressRegex = /^r[a-zA-Z0-9]{24,34}$/;
  if (!addressRegex.test(tx.Account)) {
    console.error('[Validate] Invalid Account address format');
    return false;
  }

  if (!addressRegex.test(tx.Subject)) {
    console.error('[Validate] Invalid Subject address format');
    return false;
  }

  return true;
}

/**
 * Validate CredentialAccept transaction structure
 */
export function validateCredentialAccept(
  tx: CredentialAcceptTransaction
): boolean {
  if (tx.TransactionType !== 'CredentialAccept') {
    console.error('[Validate] Invalid TransactionType:', tx.TransactionType);
    return false;
  }

  if (!tx.Account) {
    console.error('[Validate] Missing Account (user)');
    return false;
  }

  if (!tx.Issuer) {
    console.error('[Validate] Missing Issuer');
    return false;
  }

  if (!tx.CredentialType) {
    console.error('[Validate] Missing CredentialType');
    return false;
  }

  // Validate XRPL address format
  const addressRegex = /^r[a-zA-Z0-9]{24,34}$/;
  if (!addressRegex.test(tx.Account)) {
    console.error('[Validate] Invalid Account address format');
    return false;
  }

  if (!addressRegex.test(tx.Issuer)) {
    console.error('[Validate] Invalid Issuer address format');
    return false;
  }

  return true;
}
