/**
 * XRPL Browser Client
 * Handles XRPL WebSocket connections from the browser
 * Browser maintains proper WebSocket lifecycle (no serverless issues)
 */

import { Client } from 'xrpl';

// XRPL testnet servers
const XRPL_TESTNET_SERVERS = [
  'wss://s.altnet.rippletest.net:51233',
  'wss://testnet.xrpl-labs.com',
];

export interface AccountInfo {
  sequence: number;
  balance: string;
  lastLedgerSequence: number;
}

export interface SubmitResult {
  success: boolean;
  hash?: string;
  engineResult?: string;
  alreadyExists?: boolean; // true if tecDUPLICATE - credential already created
  error?: string;
}

/**
 * Create and connect an XRPL client with fallback servers
 */
export async function createXrplClient(): Promise<Client> {
  let lastError: Error | null = null;

  for (const server of XRPL_TESTNET_SERVERS) {
    try {
      console.log(`[XRPL Browser] Connecting to ${server}...`);
      const client = new Client(server, {
        connectionTimeout: 15000,
      });

      await client.connect();

      if (client.isConnected()) {
        console.log(`[XRPL Browser] Connected to ${server}`);
        return client;
      }
    } catch (error) {
      console.error(`[XRPL Browser] Failed to connect to ${server}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Failed to connect to any XRPL server');
}

/**
 * Get account info including sequence number
 * Used to prepare transactions for offline signing
 */
export async function getAccountInfo(
  client: Client,
  address: string
): Promise<AccountInfo> {
  console.log(`[XRPL Browser] Fetching account info for ${address}...`);

  const response = await client.request({
    command: 'account_info',
    account: address,
    ledger_index: 'current',
  });

  // Get current ledger index for LastLedgerSequence
  const ledgerResponse = await client.request({
    command: 'ledger_current',
  });

  const currentLedger = ledgerResponse.result.ledger_current_index;
  // Allow ~4 ledgers (~12-16 seconds) for the transaction to be included
  const lastLedgerSequence = currentLedger + 20;

  const accountData = response.result.account_data;

  console.log(`[XRPL Browser] Account info:`, {
    sequence: accountData.Sequence,
    balance: accountData.Balance,
    currentLedger,
    lastLedgerSequence,
  });

  return {
    sequence: accountData.Sequence,
    balance: accountData.Balance,
    lastLedgerSequence,
  };
}

/**
 * Submit a pre-signed transaction blob to XRPL
 */
export async function submitSignedBlob(
  client: Client,
  signedBlob: string
): Promise<SubmitResult> {
  console.log('[XRPL Browser] Submitting signed blob...');

  try {
    const result = await client.submit(signedBlob);

    const engineResult = result.result.engine_result;
    console.log('[XRPL Browser] Submit result:', engineResult);

    if (engineResult === 'tesSUCCESS' || engineResult.startsWith('tes')) {
      return {
        success: true,
        hash: result.result.tx_json?.hash,
        engineResult,
      };
    } else if (engineResult === 'tecDUPLICATE') {
      // Credential already exists - treat as success for demo flow
      console.log('[XRPL Browser] Credential already exists (tecDUPLICATE)');
      return {
        success: true,
        hash: result.result.tx_json?.hash,
        engineResult,
        alreadyExists: true,
      };
    } else {
      return {
        success: false,
        engineResult,
        error: `Transaction failed: ${engineResult} - ${result.result.engine_result_message || ''}`,
      };
    }
  } catch (error) {
    console.error('[XRPL Browser] Submit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit transaction',
    };
  }
}

/**
 * Complete flow: Connect, get account info, and return client
 * Caller is responsible for disconnecting
 */
export async function connectAndGetAccountInfo(
  address: string
): Promise<{ client: Client; accountInfo: AccountInfo }> {
  const client = await createXrplClient();
  const accountInfo = await getAccountInfo(client, address);
  return { client, accountInfo };
}

/**
 * Safely disconnect client
 */
export async function disconnectClient(client: Client): Promise<void> {
  try {
    if (client.isConnected()) {
      await client.disconnect();
      console.log('[XRPL Browser] Disconnected');
    }
  } catch (error) {
    console.error('[XRPL Browser] Disconnect error:', error);
  }
}
