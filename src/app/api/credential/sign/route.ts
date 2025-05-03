/**
 * Credential Signing API Endpoint
 * Signs credentials OFFLINE - no XRPL connection needed
 * Browser fetches sequence and submits the signed blob
 *
 * POST /api/credential/sign
 * Body: { userAddress, companyInfo, ipfsCid, sequence, lastLedgerSequence }
 * Returns: { success, signedBlob?, hash?, issuerAddress?, error? }
 */

import {
  buildCredentialCreateTransaction,
  validateCredentialCreate,
  type CredentialData,
} from '@/lib/credential-transaction';
import {
  signCredentialCreateOffline,
  getIssuerAddress,
} from '@/lib/issuer-wallet';

interface SignCredentialRequest {
  userAddress: string;
  companyInfo: {
    companyName: string;
    registrationNumber: string;
    countryOfIncorporation: string;
    contactEmail: string;
  };
  ipfsCid: string;
  sequence: number;
  lastLedgerSequence: number;
}

interface SignCredentialResponse {
  success: boolean;
  signedBlob?: string;
  hash?: string;
  issuerAddress?: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SignCredentialRequest;

    console.log('[Credential Sign API] Request received:', {
      userAddress: body.userAddress,
      companyName: body.companyInfo?.companyName,
      ipfsCid: body.ipfsCid,
      sequence: body.sequence,
      lastLedgerSequence: body.lastLedgerSequence,
    });

    // Validate required fields
    if (!body.userAddress) {
      return Response.json(
        { success: false, error: 'Missing userAddress' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    if (!body.companyInfo?.companyName) {
      return Response.json(
        { success: false, error: 'Missing company name' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    if (!body.ipfsCid) {
      return Response.json(
        { success: false, error: 'Missing IPFS CID' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    if (typeof body.sequence !== 'number' || body.sequence < 0) {
      return Response.json(
        { success: false, error: 'Invalid sequence number' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    if (typeof body.lastLedgerSequence !== 'number' || body.lastLedgerSequence < 0) {
      return Response.json(
        { success: false, error: 'Invalid lastLedgerSequence' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    // Validate XRPL address format
    const addressRegex = /^r[a-zA-Z0-9]{24,34}$/;
    if (!addressRegex.test(body.userAddress)) {
      return Response.json(
        { success: false, error: 'Invalid XRPL address format' } as SignCredentialResponse,
        { status: 400 }
      );
    }

    // Get issuer address
    let issuerAddress: string;
    try {
      issuerAddress = getIssuerAddress();
    } catch (error) {
      console.error('[Credential Sign API] Issuer wallet error:', error);
      return Response.json(
        {
          success: false,
          error: 'Issuer wallet not configured. Please set ISSUER_SEED environment variable.',
        } as SignCredentialResponse,
        { status: 500 }
      );
    }

    console.log('[Credential Sign API] Issuer address:', issuerAddress);

    // Build CredentialCreate transaction
    const credentialData: CredentialData = {
      userAddress: body.userAddress,
      issuerAddress,
      companyInfo: body.companyInfo,
      ipfsCid: body.ipfsCid,
    };

    const transaction = buildCredentialCreateTransaction(credentialData);

    // Validate transaction structure
    if (!validateCredentialCreate(transaction)) {
      return Response.json(
        { success: false, error: 'Invalid CredentialCreate transaction structure' } as SignCredentialResponse,
        { status: 500 }
      );
    }

    console.log('[Credential Sign API] Transaction built, signing offline...');

    // Sign offline (no XRPL connection needed!)
    const signResult = signCredentialCreateOffline(transaction, body.sequence, body.lastLedgerSequence);

    if (!signResult.success) {
      console.error('[Credential Sign API] Signing failed:', signResult.error);
      return Response.json(
        { success: false, error: signResult.error || 'Failed to sign credential' } as SignCredentialResponse,
        { status: 500 }
      );
    }

    console.log('[Credential Sign API] Transaction signed successfully');
    console.log('[Credential Sign API] Hash:', signResult.hash);

    return Response.json(
      {
        success: true,
        signedBlob: signResult.blob,
        hash: signResult.hash,
        issuerAddress,
      } as SignCredentialResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Credential Sign API] Error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as SignCredentialResponse,
      { status: 500 }
    );
  }
}
