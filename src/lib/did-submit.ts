/**
 * DID Transaction Submission with Crossmark Wallet
 * Uses Crossmark's signAndSubmit for automatic handling of sequence/fees
 *
 * IMPORTANT: Crossmark is a smart wallet - send "naked" transactions only!
 * Do NOT include: Sequence, Fee, LastLedgerSequence, NetworkID
 * Crossmark will handle all of these automatically.
 */

interface DIDSetTransaction {
  TransactionType: string;
  Account: string;
  URI?: string;
  Data?: string;
}

interface SubmitDIDResult {
  success: boolean;
  transactionHash?: string;
  did?: string;
  error?: string;
}

/**
 * Verifies a transaction's status on the XRPL by its hash by calling the local proxy API.
 * @param txHash The hash of the transaction to verify.
 * @returns A promise that resolves to an object with the status ('success', 'failed', 'pending') and the result data.
 */
async function verifyTransactionOnChain(
  txHash: string
): Promise<{ status: 'success' | 'failed' | 'pending'; result?: any }> {
  try {
    const response = await fetch('/api/xrpl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tx',
        params: [{ transaction: txHash, binary: false }],
      }),
    });

    if (!response.ok) {
      console.warn(`[DID Verify] Proxy request failed with status ${response.status}. Assuming pending.`);
      return { status: 'pending' };
    }

    const data = await response.json();

    // Specific errors that mean the transaction is not yet found/validated
    if (data.result?.error === 'txnNotFound' || data.error === 'txnNotFound') {
      console.log(`[DID Verify] Transaction ${txHash} not found on ledger yet.`);
      return { status: 'pending' };
    }

    if (!data.result || !data.result.validated) {
      console.log(`[DID Verify] Transaction ${txHash} found but not yet validated.`);
      return { status: 'pending' };
    }

    // We have a validated transaction, let's check the result
    const txResult = data.result.meta?.TransactionResult;
    console.log(`[DID Verify] On-chain result for ${txHash}: ${txResult}`);

    if (txResult === 'tesSUCCESS') {
      return { status: 'success', result: data.result };
    } else {
      console.error(`[DID Verify] On-chain transaction failed with result: ${txResult}`);
      return { status: 'failed', result: data.result };
    }
  } catch (error) {
    console.error('[DID Verify] Exception during transaction verification:', error);
    // Treat exceptions as 'pending' to allow for retries
    return { status: 'pending' };
  }
}

/**
 * Sign and submit a DIDSet transaction with Crossmark wallet.
 * This function first attempts to submit the transaction using `signAndSubmit`.
 * If the result isn't immediately confirmed, it polls the ledger for 10 seconds
 * to manually verify the transaction's inclusion and success.
 *
 * @param transaction - The "naked" DIDSet transaction (no Sequence/Fee/etc)
 * @param did - The formatted DID string
 * @returns Result with transaction hash or error
 */
export async function signAndSubmitDIDWithCrossmark(
  transaction: DIDSetTransaction,
  did: string
): Promise<SubmitDIDResult> {
  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return { success: false, error: 'Crossmark signing is only available in browser environment' };
    }

    // Import Crossmark SDK
    const { default: sdk } = await import('@crossmarkio/sdk');

    // Verify Crossmark is connected
    if (!sdk.session?.address) {
      return { success: false, error: 'Crossmark wallet not connected. Please connect your wallet first.' };
    }

    console.log('[DID Submit] Preparing naked DIDSet transaction for Crossmark');
    const nakedTx: any = {
      TransactionType: 'DIDSet',
      Account: transaction.Account,
    };
    if (transaction.URI) nakedTx.URI = transaction.URI;
    if (transaction.Data) nakedTx.Data = transaction.Data;

    // 1. Use sdk.async.signAndSubmitAndWait() - Crossmark SDK pattern
    // Returns: { request, response, createdAt, resolvedAt }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { request, response, createdAt, resolvedAt } = await (sdk.async.signAndSubmitAndWait(nakedTx) as any);

    // 2. Log confirmation that the promise has resolved
    console.log('[DID Submit] Crossmark response:', { request, response, createdAt, resolvedAt });

    // 3. Explicitly check for immediate success, as requested
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialResult = (response as any)?.result?.meta?.TransactionResult;
    if (initialResult === 'tesSUCCESS') {
      console.log('[DID Submit] ✓ Transaction confirmed immediately in signAndSubmit response.');
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactionHash: (response as any).result.hash,
        did,
      };
    }

    // Extract the transaction hash for polling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txHash = (response as any)?.result?.hash;
    if (!txHash) {
      throw new Error('Could not extract transaction hash from Crossmark response.');
    }

    // 4. Fallback: Manual polling for up to 10 seconds
    console.log(`[DID Submit] Initiating 10-second manual verification for hash: ${txHash}`);
    const startTime = Date.now();
    while (Date.now() - startTime < 10000) {
      const { status, result } = await verifyTransactionOnChain(txHash);

      if (status === 'success') {
        console.log('[DID Submit] ✓ Manual on-chain verification successful.');
        return { success: true, transactionHash: txHash, did };
      }
      if (status === 'failed') {
        const failureReason = result?.meta?.TransactionResult || 'Unknown on-chain failure';
        throw new Error(`Transaction failed on-chain with status: ${failureReason}`);
      }
      // If status is 'pending', wait for 2 seconds before the next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 5. If the loop completes, the transaction has timed out
    throw new Error(`Transaction confirmation timed out after 10 seconds for hash: ${txHash}`);
  } catch (error) {
    console.error('[DID Submit] Final exception:', error);

    let errorMessage = 'Failed to submit DID transaction';
    if (error instanceof Error) {
      if (
        error.message.includes('cancelled') ||
        error.message.includes('rejected') ||
        error.message.includes('Cancelled') ||
        error.message.includes('denied')
      ) {
        errorMessage = 'You cancelled the transaction in Crossmark.';
      } else {
        errorMessage = error.message;
      }
    }

    return { success: false, error: errorMessage };
  }
}
