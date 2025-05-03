/**
 * XRPL Testnet Proxy API Route
 * Forwards requests to XRPL testnet to avoid CORS issues in browser
 */

export const runtime = 'nodejs';

const TESTNET_ENDPOINT = 'https://s.altnet.rippletest.net:51234';

interface XRPLRequest {
  method: string;
  params?: unknown[];
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const body: XRPLRequest = await request.json();

    // Validate that we have a method
    if (!body.method) {
      return Response.json(
        { error: 'Missing RPC method' },
        { status: 400 }
      );
    }

    console.log(`[XRPL Proxy] Forwarding request: ${body.method}`);

    // Forward the request to XRPL testnet with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(TESTNET_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get the response data
      const data = await response.json();

      // Log the result
      if (data.result?.status === 'success') {
        console.log(`[XRPL Proxy] Success: ${body.method}`);
      } else if (data.error) {
        console.log(`[XRPL Proxy] Error: ${body.method} - ${data.error.message}`);
      }

      // Return the response from XRPL
      return Response.json(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[XRPL Proxy] Error:', error);

    // Return error response
    return Response.json(
      {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
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
