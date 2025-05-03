/**
 * Credential Accept API Endpoint
 * Builds NAKED CredentialAccept transaction for user to sign with Crossmark
 *
 * IMPORTANT: Returns a "naked" transaction for Crossmark!
 * Crossmark is a smart wallet - it handles Fee, Sequence, LastLedgerSequence automatically.
 * Do NOT include these fields in the transaction.
 *
 * POST /api/credential/accept
 * Body: { userAddress }
 * Returns: { success, transaction?, error? }
 */

import {
  buildCredentialAcceptTransaction,
  validateCredentialAccept,
} from '@/lib/credential-transaction';
import { getIssuerAddress } from '@/lib/issuer-wallet';

interface AcceptCredentialRequest {
  userAddress: string;
}

interface AcceptCredentialResponse {
  success: boolean;
  transaction?: {
    TransactionType: string;
    Account: string;
    Issuer: string;
    CredentialType: string;
    // NO Fee, Sequence, LastLedgerSequence - Crossmark handles these
  };
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as AcceptCredentialRequest;

    console.log('[Credential Accept API] Request received:', {
      userAddress: body.userAddress,
    });

    // Validate required fields
    if (!body.userAddress) {
      return Response.json(
        {
          success: false,
          error: 'Missing userAddress',
        } as AcceptCredentialResponse,
        { status: 400 }
      );
    }

    // Validate XRPL address format
    const addressRegex = /^r[a-zA-Z0-9]{24,34}$/;
    if (!addressRegex.test(body.userAddress)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid XRPL address format',
        } as AcceptCredentialResponse,
        { status: 400 }
      );
    }

    // Get issuer address
    let issuerAddress: string;
    try {
      issuerAddress = getIssuerAddress();
    } catch (error) {
      console.error('[Credential Accept API] Issuer wallet error:', error);
      return Response.json(
        {
          success: false,
          error: 'Issuer wallet not configured',
        } as AcceptCredentialResponse,
        { status: 500 }
      );
    }

    console.log('[Credential Accept API] Issuer address:', issuerAddress);

    // Build unsigned CredentialAccept transaction
    const transaction = buildCredentialAcceptTransaction(
      body.userAddress,
      issuerAddress
    );

    // Validate transaction structure
    if (!validateCredentialAccept(transaction)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid CredentialAccept transaction structure',
        } as AcceptCredentialResponse,
        { status: 500 }
      );
    }

    console.log('[Credential Accept API] Naked transaction built for Crossmark');

    // Return NAKED transaction for Crossmark - NO Fee/Sequence/LastLedgerSequence
    return Response.json(
      {
        success: true,
        transaction: {
          TransactionType: transaction.TransactionType,
          Account: transaction.Account,
          Issuer: transaction.Issuer,
          CredentialType: transaction.CredentialType,
          // NO Fee - Crossmark handles this automatically
        },
      } as AcceptCredentialResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Credential Accept API] Error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as AcceptCredentialResponse,
      { status: 500 }
    );
  }
}
