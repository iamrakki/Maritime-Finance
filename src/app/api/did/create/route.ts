/**
 * DID Creation API Endpoint
 * Builds the DIDSet transaction for signing with Crossmark wallet in the browser
 *
 * IMPORTANT: Returns a "naked" transaction for Crossmark!
 * Crossmark is a smart wallet - it handles Fee, Sequence, LastLedgerSequence automatically.
 * Do NOT include these fields in the transaction.
 */

import {
  buildDIDSetTransaction,
  validateDIDSetTransaction,
  formatDID,
  type CompanyDIDData,
} from '@/lib/didset-transaction';

interface CreateDIDRequest {
  walletAddress: string;
  companyName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  contactEmail: string;
  contactPhone?: string;
  registeredAddress?: string;
}

interface CreateDIDResponse {
  success: boolean;
  did?: string;
  transaction?: {
    TransactionType: string;
    Account: string;
    URI?: string;
    Data?: string;
    // NO Fee, Sequence, LastLedgerSequence - Crossmark handles these
  };
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse the request body
    const body = (await request.json()) as CreateDIDRequest;

    console.log('[DID Create] Received request:', {
      walletAddress: body.walletAddress,
      companyName: body.companyName,
    });

    // Validate required fields
    if (!body.walletAddress || !body.companyName || !body.registrationNumber) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: walletAddress, companyName, registrationNumber',
        } as CreateDIDResponse,
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!body.walletAddress.match(/^r[a-zA-Z0-9]{24,34}$/)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid XRPL wallet address format',
        } as CreateDIDResponse,
        { status: 400 }
      );
    }

    // Build DIDSet transaction
    const didData: CompanyDIDData = {
      walletAddress: body.walletAddress,
      companyName: body.companyName,
      registrationNumber: body.registrationNumber,
      countryOfIncorporation: body.countryOfIncorporation,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      registeredAddress: body.registeredAddress,
    };

    const transaction = buildDIDSetTransaction(didData);

    // Validate the transaction
    if (!validateDIDSetTransaction(transaction)) {
      return Response.json(
        {
          success: false,
          error: 'Failed to build valid DIDSet transaction',
        } as CreateDIDResponse,
        { status: 500 }
      );
    }

    console.log('[DID Create API] Built DIDSet transaction');

    // Return the NAKED transaction to the browser
    // Crossmark is a smart wallet - NO Fee, Sequence, LastLedgerSequence needed!
    const did = formatDID(body.walletAddress);

    // Build naked transaction for Crossmark
    const nakedTransaction: CreateDIDResponse['transaction'] = {
      TransactionType: transaction.TransactionType,
      Account: transaction.Account,
    };

    // Only include URI if present
    if (transaction.URI) {
      nakedTransaction.URI = transaction.URI;
    }

    console.log('[DID Create API] Naked transaction for Crossmark:', nakedTransaction);

    return Response.json(
      {
        success: true,
        did,
        transaction: nakedTransaction,
      } as CreateDIDResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[DID Create] Error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as CreateDIDResponse,
      { status: 500 }
    );
  }
}

// Handle other methods
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
