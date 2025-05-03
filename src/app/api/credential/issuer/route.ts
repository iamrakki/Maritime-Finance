/**
 * Get Issuer Address API
 * Returns the platform's issuer address (public info, no secrets)
 *
 * GET /api/credential/issuer
 * Returns: { success, address?, error? }
 */

import { getIssuerAddress } from '@/lib/issuer-wallet';

interface IssuerResponse {
  success: boolean;
  address?: string;
  error?: string;
}

export async function GET(): Promise<Response> {
  try {
    const address = getIssuerAddress();

    return Response.json(
      { success: true, address } as IssuerResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Issuer API] Error:', error);

    return Response.json(
      {
        success: false,
        error: 'Issuer wallet not configured. Please set ISSUER_SEED environment variable.',
      } as IssuerResponse,
      { status: 500 }
    );
  }
}
