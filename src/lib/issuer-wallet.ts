/**
 * Issuer Wallet Management
 * Handles platform wallet for issuing KYC credentials
 * Server-side only - never expose seed to client
 */

import { Wallet } from 'xrpl';

// List of XRPL testnet servers to try (in order)
const XRPL_TESTNET_SERVERS = [
  'wss://s.altnet.rippletest.net:51233',
  'wss://testnet.xrpl-labs.com',
];

let issuerWallet: Wallet | null = null;

/**
 * Initialize issuer wallet from environment variable
 * Throws if ISSUER_SEED not configured
 */
export function getIssuerWallet(): Wallet {
  if (issuerWallet) {
    return issuerWallet;
  }

  const seed = process.env.ISSUER_SEED;

  if (!seed) {
    throw new Error('ISSUER_SEED not configured in environment variables');
  }

  if (!seed.startsWith('s')) {
    throw new Error('Invalid ISSUER_SEED format. XRPL seeds must start with "s"');
  }

  issuerWallet = Wallet.fromSeed(seed);
  console.log('[Issuer Wallet] Initialized with address:', issuerWallet.address);

  return issuerWallet;
}

/**
 * Get issuer wallet address without exposing seed
 */
export function getIssuerAddress(): string {
  return getIssuerWallet().address;
}

/**
 * Sign a CredentialCreate transaction OFFLINE
 * No XRPL connection needed - pure cryptographic operation
 * Browser provides sequence and lastLedgerSequence from its connection
 *
 * @param transaction - Base CredentialCreate transaction
 * @param sequence - Account sequence number (fetched by browser)
 * @param lastLedgerSequence - Last valid ledger (fetched by browser)
 * @returns Signed transaction blob and hash
 */
export function signCredentialCreateOffline(
  transaction: {
    TransactionType: 'CredentialCreate';
    Account: string;
    Subject: string;
    CredentialType: string;
    URI?: string;
    Fee: string;
  },
  sequence: number,
  lastLedgerSequence: number
): { success: boolean; blob?: string; hash?: string; error?: string } {
  try {
    const wallet = getIssuerWallet();

    // Build the complete transaction with sequence info
    const preparedTx = {
      TransactionType: transaction.TransactionType,
      Account: wallet.address, // Use wallet address, not passed account
      Subject: transaction.Subject,
      CredentialType: transaction.CredentialType,
      URI: transaction.URI,
      Fee: transaction.Fee,
      Sequence: sequence,
      LastLedgerSequence: lastLedgerSequence,
    };

    console.log('[Issuer] Signing offline:', {
      Account: preparedTx.Account,
      Subject: preparedTx.Subject,
      CredentialType: preparedTx.CredentialType,
      Sequence: preparedTx.Sequence,
      LastLedgerSequence: preparedTx.LastLedgerSequence,
    });

    // Sign the transaction - NO network connection needed!
    const signed = wallet.sign(preparedTx as any);

    console.log('[Issuer] Signed successfully, hash:', signed.hash);

    return {
      success: true,
      blob: signed.tx_blob,
      hash: signed.hash,
    };
  } catch (error) {
    console.error('[Issuer] Offline signing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign transaction',
    };
  }
}

/**
 * Try to connect to XRPL testnet with fallback servers
 * Uses robust connection pattern to handle Next.js API route lifecycle
 * @deprecated Use browser-side connection instead
 */
async function connectToTestnet(Client: any): Promise<any> {
  let lastError: Error | null = null;

  for (const server of XRPL_TESTNET_SERVERS) {
    try {
      console.log(`[Issuer] Trying server: ${server}`);
      const client = new Client(server, {
        connectionTimeout: 20000,
      });

      // Explicitly wait for connection to be READY
      await client.connect();

      // Safety check - verify connection is actually established
      if (!client.isConnected()) {
        throw new Error('Failed to establish WebSocket handshake');
      }

      console.log(`[Issuer] Connected to ${server}`);
      return client;
    } catch (error) {
      console.error(`[Issuer] Failed to connect to ${server}:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Failed to connect to any XRPL testnet server');
}

/**
 * Sign and submit a CredentialCreate transaction
 * This is called server-side to issue credentials on behalf of the platform
 *
 * @param transaction - Unsigned CredentialCreate transaction
 * @returns Result with transaction hash or error
 */
export async function signAndSubmitCredentialCreate(
  transaction: {
    TransactionType: 'CredentialCreate';
    Account: string;
    Subject: string;
    CredentialType: string;
    URI?: string;
    Fee: string;
  }
): Promise<{ success: boolean; hash?: string; error?: string }> {
  const { Client } = await import('xrpl');

  let client: any = null;

  try {
    const wallet = getIssuerWallet();

    console.log('[Issuer] Connecting to XRPL Testnet...');
    client = await connectToTestnet(Client);

    // Verify connection is still active before proceeding
    if (!client.isConnected()) {
      throw new Error('Connection lost after initial handshake');
    }

    console.log('[Issuer] Issuer address:', wallet.address);
    console.log('[Issuer] Building CredentialCreate transaction...');
    console.log('[Issuer] Subject (user):', transaction.Subject);
    console.log('[Issuer] CredentialType:', transaction.CredentialType);

    // Prepare the transaction using autofill
    const prepared = await client.autofill({
      TransactionType: transaction.TransactionType,
      Account: transaction.Account,
      Subject: transaction.Subject,
      CredentialType: transaction.CredentialType,
      URI: transaction.URI,
    } as any);

    console.log('[Issuer] Transaction prepared:', {
      Fee: prepared.Fee,
      Sequence: prepared.Sequence,
      LastLedgerSequence: prepared.LastLedgerSequence,
    });

    // Sign the transaction
    console.log('[Issuer] Signing transaction with issuer wallet...');
    const signed = wallet.sign(prepared);
    console.log('[Issuer] Transaction signed, hash:', signed.hash);

    // Submit the transaction (use submit instead of submitAndWait to avoid timeout)
    console.log('[Issuer] Submitting to XRPL...');
    const submitResult = await client.submit(signed.tx_blob);

    console.log('[Issuer] Submit result:', submitResult.result.engine_result);

    // Check preliminary result
    if (submitResult.result.engine_result === 'tesSUCCESS') {
      console.log('[Issuer] ✓ CredentialCreate submitted successfully (preliminary)');
      console.log('[Issuer] Transaction hash:', signed.hash);
      console.log('[Issuer] Transaction will be validated in the next ledger');

      await client.disconnect();
      return { success: true, hash: signed.hash };
    } else if (submitResult.result.engine_result.startsWith('tes')) {
      // tes codes are generally success
      console.log('[Issuer] ✓ CredentialCreate submitted with result:', submitResult.result.engine_result);
      console.log('[Issuer] Transaction hash:', signed.hash);

      await client.disconnect();
      return { success: true, hash: signed.hash };
    } else {
      console.error('[Issuer] Transaction submission failed:', submitResult.result.engine_result);
      console.error('[Issuer] Error message:', submitResult.result.engine_result_message);

      await client.disconnect();
      return {
        success: false,
        error: `Transaction failed: ${submitResult.result.engine_result} - ${submitResult.result.engine_result_message || ''}`,
      };
    }

  } catch (error) {
    console.error('[Issuer] Error:', error);
    console.error('[Issuer] Error stack:', error instanceof Error ? error.stack : 'No stack');

    if (client) {
      try {
        if (client.isConnected && client.isConnected()) {
          await client.disconnect();
        }
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }

    let errorMessage = 'Failed to issue credential';

    if (error instanceof Error) {
      if (error.message.includes('actNotFound') || error.message.includes('Account not found')) {
        errorMessage = 'Issuer account not found on XRPL testnet. Please fund the account at https://faucet.altnet.rippletest.net/accounts';
      } else if (error.message.includes('tecUNFUNDED') || error.message.includes('unfunded')) {
        errorMessage = 'Issuer account has insufficient XRP balance. Please fund at https://faucet.altnet.rippletest.net/accounts';
      } else if (error.message.includes('websocket') || error.message.includes('closed')) {
        errorMessage = 'Connection to XRPL testnet was closed. The testnet may be unstable. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection to XRPL testnet timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('connect')) {
        errorMessage = 'Unable to connect to XRPL testnet. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
