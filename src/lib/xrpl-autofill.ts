/**
 * Browser-side XRPL Transaction Autofill
 * Autofills DIDSet transactions with Sequence and LastLedgerSequence fields
 * This runs in the browser where WebSocket connectivity is reliable
 */

interface Transaction {
  TransactionType: string;
  Account: string;
  URI?: string;
  Fee: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  SigningPubKey?: string;
}

export interface PaymentTransaction {
  TransactionType: 'Payment';
  Account: string;
  Destination: string;
  Amount: string;
  Memos?: Array<{ Memo: { MemoData: string; MemoType?: string; MemoFormat?: string } }>;
  Fee?: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  SigningPubKey?: string;
}

interface XrplResponse<T> {
  result?: T;
  error?: { message?: string };
}

async function fetchXrpl<T>(method: string, params?: unknown[]): Promise<XrplResponse<T>> {
  const response = await fetch('/api/xrpl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`XRPL proxy error: ${response.statusText}`);
  }

  return (await response.json()) as XrplResponse<T>;
}

/**
 * Autofill a DIDSet transaction with required XRPL fields
 * Fetches the current sequence number and calculates appropriate ledger bounds
 *
 * @param transaction - Base transaction to autofill
 * @returns Transaction with Sequence and LastLedgerSequence added
 */
export async function autofillTransaction(transaction: Transaction): Promise<Transaction> {
  console.log('[Autofill] Starting transaction autofill...');
  console.log('[Autofill] Transaction Account:', transaction.Account);

  try {
    // Use the /api/xrpl endpoint as a proxy to fetch account info
    console.log('[Autofill] Fetching account info from XRPL via /api/xrpl...');

    const response = await fetch('/api/xrpl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [
          {
            account: transaction.Account,
            ledger_index: 'validated',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account info: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Autofill] Account info response:', data);

    if (!data.result || !data.result.account_data) {
      throw new Error('No account data in response');
    }

    const accountData = data.result.account_data;
    const currentSequence = accountData.Sequence;
    const ledgerIndex = accountData.LedgerEntryIndex || data.result.ledger_index;

    if (!currentSequence) {
      throw new Error('Could not determine current sequence number');
    }

    console.log('[Autofill] ✓ Current sequence:', currentSequence);
    console.log('[Autofill] ✓ Ledger index:', ledgerIndex);

    // Calculate LastLedgerSequence: current ledger + 20 ledgers (typical buffer)
    const lastLedgerSequence = (ledgerIndex || currentSequence) + 20;

    console.log('[Autofill] LastLedgerSequence:', lastLedgerSequence);

    // Add autofilled fields to the transaction
    const autofilled = {
      ...transaction,
      Sequence: currentSequence,
      LastLedgerSequence: lastLedgerSequence,
      SigningPubKey: '', // Will be filled by Crossmark
    };

    console.log('[Autofill] ✓ Transaction autofilled successfully');
    console.log('[Autofill] Autofilled transaction:', {
      TransactionType: autofilled.TransactionType,
      Account: autofilled.Account,
      Sequence: autofilled.Sequence,
      LastLedgerSequence: autofilled.LastLedgerSequence,
      Fee: autofilled.Fee,
    });

    return autofilled;
  } catch (error) {
    console.error('[Autofill] Error autofilling transaction:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to autofill transaction: ${errorMessage}`);
  }
}

/**
 * Autofill a Payment transaction with Fee, Sequence, and LastLedgerSequence.
 */
export async function autofillPaymentTransaction(
  transaction: PaymentTransaction
): Promise<PaymentTransaction> {
  console.log('[Autofill] Starting Payment autofill...');
  console.log('[Autofill] Payment Account:', transaction.Account);

  try {
    const [accountInfo, feeInfo, ledgerInfo] = await Promise.all([
      fetchXrpl<{ account_data: { Sequence: number } }>('account_info', [
        {
          account: transaction.Account,
          ledger_index: 'validated',
        },
      ]),
      fetchXrpl<{ drops: { open_ledger_fee: string } }>('fee'),
      fetchXrpl<{ ledger_current_index: number }>('ledger_current'),
    ]);

    if (!accountInfo.result?.account_data?.Sequence) {
      throw new Error('Could not determine current sequence number');
    }

    const openLedgerFee = feeInfo.result?.drops?.open_ledger_fee;
    if (!openLedgerFee) {
      throw new Error('Could not determine open ledger fee');
    }

    const ledgerIndex = ledgerInfo.result?.ledger_current_index;
    if (typeof ledgerIndex !== 'number') {
      throw new Error('Could not determine current ledger index');
    }

    const lastLedgerSequence = ledgerIndex + 20;

    return {
      ...transaction,
      Fee: openLedgerFee,
      Sequence: accountInfo.result.account_data.Sequence,
      LastLedgerSequence: lastLedgerSequence,
    };
  } catch (error) {
    console.error('[Autofill] Error autofilling Payment:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to autofill Payment: ${errorMessage}`);
  }
}
