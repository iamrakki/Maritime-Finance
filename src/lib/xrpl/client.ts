/**
 * XRPL Client Management
 *
 * Handles connection to XRPL testnet and provides singleton client instance
 */

import { Client } from 'xrpl';
import { XRPL_TESTNET_URL } from '@/types/waterfall';

let client: Client | null = null;
let isConnecting = false;

/**
 * Get or create XRPL client instance
 */
export async function getXRPLClient(): Promise<Client> {
  if (client && client.isConnected()) {
    return client;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getXRPLClient();
  }

  isConnecting = true;

  try {
    // Create client with Xahau-specific configuration
    client = new Client(XRPL_TESTNET_URL, {
      // Xahau Testnet requires API version 1
      connectionTimeout: 30000,
    });

    // Override the request method BEFORE connecting to ensure api_version: 1 for all requests
    const originalRequest = client.request.bind(client);
    (client as any).request = function(req: any) {
      // Always inject api_version: 1 for Xahau Testnet
      return originalRequest({ ...req, api_version: 1 });
    };

    console.log('🔌 Connecting to Xahau Testnet...');
    await client.connect();
    console.log('✅ Connected to Xahau Testnet');

    return client;
  } catch (error) {
    console.error('❌ Failed to connect to XRPL:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Disconnect from XRPL
 */
export async function disconnectXRPL(): Promise<void> {
  if (client && client.isConnected()) {
    console.log('🔌 Disconnecting from XRPL...');
    await client.disconnect();
    client = null;
    console.log('✅ Disconnected from XRPL');
  }
}

/**
 * Check if client is connected
 */
export function isClientConnected(): boolean {
  return client !== null && client.isConnected();
}
