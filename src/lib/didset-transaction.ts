/**
 * DIDSet Transaction Builder
 * Creates properly formatted DIDSet transactions for XRPL
 */

export interface CompanyDIDData {
  walletAddress: string;
  companyName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  contactEmail: string;
  contactPhone?: string;
  registeredAddress?: string;
}

export interface DIDSetTransaction {
  TransactionType: 'DIDSet';
  Account: string;
  URI?: string;
  DIDDocument?: string;
  Fee: string;
  // Fields added by autofill() for transaction submission
  Sequence?: number;
  LastLedgerSequence?: number;
  SigningPubKey?: string;
}

/**
 * Build a DIDSet transaction payload for XRPL
 *
 * DIDSet transactions on XRPL follow this structure:
 * - TransactionType: must be "DIDSet"
 * - Account: the wallet address creating the DID
 * - URI: encoded metadata about the DID (usually base64 encoded)
 * - Fee: transaction fee in drops (1 XRP = 1,000,000 drops)
 *
 * @param data - Company information to embed in the DID
 * @returns DIDSet transaction ready to sign and submit
 */
export function buildDIDSetTransaction(data: CompanyDIDData): DIDSetTransaction {
  // Create the DID metadata object
  const didMetadata = {
    id: formatDID(data.walletAddress),
    type: 'ShipownerDID',
    company: {
      name: data.companyName,
      registrationNumber: data.registrationNumber,
      country: data.countryOfIncorporation,
      email: data.contactEmail,
      phone: data.contactPhone || '',
      address: data.registeredAddress || '',
    },
    createdAt: new Date().toISOString(),
    version: '1.0',
  };

  // Encode metadata as JSON and then to hex for URI field
  const metadataJson = JSON.stringify(didMetadata);
  const metadataHex = stringToHex(metadataJson);

  console.log('DIDSet metadata:', didMetadata);
  console.log('Metadata JSON:', metadataJson);
  console.log('Metadata Hex:', metadataHex);

  // Build the DIDSet transaction
  const transaction: DIDSetTransaction = {
    TransactionType: 'DIDSet',
    Account: data.walletAddress,
    URI: metadataHex,
    Fee: '12', // Standard DIDSet fee in drops (0.000012 XRP)
  };

  return transaction;
}

/**
 * Format a DID string based on wallet address
 * XRPL DID format: did:xrpl:mainnet:{walletAddress} or did:xrpl:testnet:{walletAddress}
 *
 * @param walletAddress - The XRPL wallet address
 * @returns Formatted DID string
 */
export function formatDID(walletAddress: string): string {
  // Use testnet format since we're on testnet
  return `did:xrpl:testnet:${walletAddress}`;
}

/**
 * Convert a string to hexadecimal
 * Used to encode DID metadata for the URI field
 *
 * @param str - String to convert
 * @returns Hex representation of the string
 */
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const hexCode = code.toString(16);
    hex += hexCode.length === 1 ? '0' + hexCode : hexCode;
  }
  return hex.toUpperCase();
}

/**
 * Convert hexadecimal back to string
 * Used to decode DID metadata from the URI field
 *
 * @param hex - Hex string to convert
 * @returns Original string
 */
export function hexToString(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(code);
  }
  return str;
}

/**
 * Validate a DIDSet transaction
 *
 * @param transaction - Transaction to validate
 * @returns true if valid, false otherwise
 */
export function validateDIDSetTransaction(
  transaction: DIDSetTransaction
): boolean {
  if (transaction.TransactionType !== 'DIDSet') {
    console.error('Invalid transaction type:', transaction.TransactionType);
    return false;
  }

  if (!transaction.Account) {
    console.error('Missing Account field');
    return false;
  }

  if (!transaction.Account.match(/^r[a-zA-Z0-9]{24,34}$/)) {
    console.error('Invalid account address format');
    return false;
  }

  if (!transaction.URI) {
    console.error('Missing URI field with DID metadata');
    return false;
  }

  return true;
}
