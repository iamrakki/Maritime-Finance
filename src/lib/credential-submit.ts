/**
 * Credential Transaction Submission with Crossmark
 *
 * NOTE: Crossmark SDK uses xrpl@2.14.1 which doesn't recognize
 * CredentialAccept as a valid TransactionType. The Credentials amendment
 * was enabled on XRPL mainnet on September 4, 2025, but Crossmark SDK
 * hasn't been updated yet.
 *
 * DEMO MODE: For now, we simulate the CredentialAccept in demo mode.
 * This allows the demo to proceed while Crossmark updates their SDK.
 */

interface CredentialAcceptTransaction {
  TransactionType: string;
  Account: string;
  Issuer: string;
  CredentialType: string;
}

interface SubmitCredentialResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  demoMode?: boolean;
}

// Demo mode flag - set to true to simulate CredentialAccept
// Set to false to attempt real Crossmark signing (will fail until Crossmark updates)
const DEMO_MODE = true;

/**
 * Sign CredentialAccept with Crossmark and submit to XRPL
 *
 * NOTE: Currently in DEMO MODE because Crossmark SDK (xrpl@2.14.1) doesn't
 * support the CredentialAccept transaction type (XLS-70).
 *
 * In demo mode, we simulate a successful acceptance.
 * When Crossmark updates their SDK, set DEMO_MODE = false.
 *
 * @param transaction - The CredentialAccept transaction fields
 * @returns Result with transaction hash or error
 */
export async function signAndSubmitCredentialWithCrossmark(
  transaction: CredentialAcceptTransaction
): Promise<SubmitCredentialResult> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Crossmark signing only available in browser',
    };
  }

  // Import Crossmark SDK to verify connection
  const { default: sdk } = await import('@crossmarkio/sdk');

  // Verify Crossmark is connected
  if (!sdk.session?.address) {
    return {
      success: false,
      error: 'Crossmark wallet not connected',
    };
  }

  console.log('[Credential Submit] Starting CredentialAccept flow');
  console.log('[Credential Submit] Account:', transaction.Account);
  console.log('[Credential Submit] Issuer:', transaction.Issuer);
  console.log('[Credential Submit] CredentialType:', transaction.CredentialType);

  if (DEMO_MODE) {
    // DEMO MODE: Simulate successful acceptance
    console.log('[Credential Submit] ⚠️ DEMO MODE: Simulating CredentialAccept');
    console.log('[Credential Submit] Note: Crossmark SDK does not yet support CredentialAccept (XLS-70)');

    // Simulate a small delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a demo transaction hash
    const demoHash = `DEMO_${Date.now().toString(16).toUpperCase()}_CREDENTIAL_ACCEPT`;

    console.log('[Credential Submit] ✓ Demo CredentialAccept simulated');
    console.log('[Credential Submit] Demo Hash:', demoHash);

    return {
      success: true,
      transactionHash: demoHash,
      demoMode: true,
    };
  }

  // REAL MODE: Attempt to use Crossmark (will likely fail)
  try {
    console.log('[Credential Submit] Attempting real Crossmark signing...');

    // Build the transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preparedTx: any = {
      TransactionType: 'CredentialAccept',
      Account: transaction.Account,
      Issuer: transaction.Issuer,
      CredentialType: transaction.CredentialType,
    };

    // Try signAndSubmitAndWait
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (sdk.async.signAndSubmitAndWait(preparedTx) as any);

    console.log('[Credential Submit] Crossmark response:', result);

    const txResult = result?.response?.result?.meta?.TransactionResult ||
                     result?.response?.result?.engine_result;
    const txHash = result?.response?.result?.hash ||
                   result?.response?.result?.tx_json?.hash;

    if (txResult === 'tesSUCCESS' || txHash) {
      console.log('[Credential Submit] ✓ CredentialAccept submitted successfully!');
      return {
        success: true,
        transactionHash: txHash,
      };
    }

    return {
      success: false,
      error: txResult || 'Transaction failed',
    };
  } catch (error) {
    console.error('[Credential Submit] Exception:', error);

    let errorMessage = 'Failed to submit credential transaction';

    if (error instanceof Error) {
      if (error.message.includes('Invalid field TransactionType')) {
        errorMessage = 'Crossmark does not support CredentialAccept yet (XLS-70). The Crossmark SDK needs to be updated to support this new transaction type.';
      } else if (
        error.message.includes('cancelled') ||
        error.message.includes('rejected')
      ) {
        errorMessage = 'You cancelled the transaction in Crossmark.';
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
