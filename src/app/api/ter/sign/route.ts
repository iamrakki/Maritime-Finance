/**
 * TER memo signing API (registry seed).
 *
 * POST /api/ter/sign
 * Body: { memo, submit?, waitForValidation? }
 * Returns: { success, signedBlob?, hash?, submitResult?, error? }
 */

import { Wallet, type Payment } from 'xrpl';
import { serializeTerMemo, validateTerMemo, type TerMemo } from '@/lib/ter-memo';
import { isLowerHex, toHexLower } from '@/lib/hex-utils';

export const runtime = 'nodejs';

const XRPL_TESTNET_HTTP = 'https://s.altnet.rippletest.net:51234';

interface TerSignRequest {
  memo: TerMemo;
  submit?: boolean;
  waitForValidation?: boolean;
}

interface TerSignResponse {
  success: boolean;
  signedBlob?: string;
  hash?: string;
  submitResult?: {
    engineResult?: string;
    accepted?: boolean;
    validated?: boolean;
    ledgerIndex?: number;
    error?: string;
  };
  error?: string;
}

async function xrplRequest<T>(method: string, params?: unknown[]): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(XRPL_TESTNET_HTTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`XRPL HTTP error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_message || data.error?.message || 'XRPL request failed');
    }

    return data.result as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function xrplRequestRaw(
  method: string,
  params?: unknown[]
): Promise<{ result?: unknown; error?: { error?: string; error_message?: string } }> {
  const response = await fetch(XRPL_TESTNET_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });

  if (!response.ok) {
    return { error: { error_message: response.statusText } };
  }

  return response.json();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as TerSignRequest;
    const validation = validateTerMemo(body.memo);
    if (!validation.ok) {
      return Response.json(
        { success: false, error: validation.error } as TerSignResponse,
        { status: 400 }
      );
    }

    const issuerSeed = process.env.ISSUER_SEED;
    if (!issuerSeed) {
      return Response.json(
        { success: false, error: 'ISSUER_SEED not configured in environment variables' } as TerSignResponse,
        { status: 500 }
      );
    }

    if (!issuerSeed.startsWith('s')) {
      return Response.json(
        { success: false, error: 'Invalid ISSUER_SEED format. XRPL seeds must start with "s"' } as TerSignResponse,
        { status: 500 }
      );
    }

    const registrySeed = process.env.REGISTRY_SEED;
    if (!registrySeed) {
      return Response.json(
        { success: false, error: 'REGISTRY_SEED not configured in environment variables' } as TerSignResponse,
        { status: 500 }
      );
    }

    if (!registrySeed.startsWith('s')) {
      return Response.json(
        { success: false, error: 'Invalid REGISTRY_SEED format. XRPL seeds must start with "s"' } as TerSignResponse,
        { status: 500 }
      );
    }

    const issuerWallet = Wallet.fromSeed(issuerSeed);
    const registryWallet = Wallet.fromSeed(registrySeed);
    const { memoDataHex } = serializeTerMemo(body.memo);
    const memoTypeHex = toHexLower('ter');
    const memoFormatHex = toHexLower('application/json');

    if (!isLowerHex(memoDataHex) || !isLowerHex(memoTypeHex) || !isLowerHex(memoFormatHex)) {
      return Response.json(
        { success: false, error: 'Memo fields must be lowercase hex' } as TerSignResponse,
        { status: 400 }
      );
    }

    const baseTransaction: Payment = {
      TransactionType: 'Payment' as const,
      Account: issuerWallet.address,
      Destination: registryWallet.address,
      Amount: '1',
      Memos: [
        {
          Memo: {
            MemoType: memoTypeHex,
            MemoFormat: memoFormatHex,
            MemoData: memoDataHex,
          },
        },
      ],
    };

    const accountInfo = await xrplRequest<{ account_data: { Sequence: number } }>('account_info', [
      { account: issuerWallet.address, ledger_index: 'validated' },
    ]);
    const feeInfo = await xrplRequest<{ drops: { open_ledger_fee: string } }>('fee');
    const ledgerInfo = await xrplRequest<{ ledger_current_index: number }>('ledger_current');

    const prepared: Payment = {
      ...baseTransaction,
      Fee: feeInfo.drops.open_ledger_fee,
      Sequence: accountInfo.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.ledger_current_index + 20,
    };

    const signed = issuerWallet.sign(prepared);
    const hash = signed.hash;

    let submitResult: TerSignResponse['submitResult'];
    if (body.submit) {
      if (body.waitForValidation) {
        const submit = await xrplRequest<{ engine_result: string; engine_result_message?: string }>('submit', [
          { tx_blob: signed.tx_blob },
        ]);
        const engineResult = submit.engine_result;
        submitResult = {
          engineResult,
          accepted: engineResult.startsWith('tes'),
        };

        for (let attempt = 0; attempt < 10; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const txResponse = await xrplRequestRaw('tx', [{ transaction: hash }]);
          if (txResponse.error?.error === 'txnNotFound') {
            continue;
          }
          if (txResponse.error) {
            throw new Error(txResponse.error.error_message || 'Failed to fetch transaction');
          }
          const result = txResponse.result as { validated?: boolean; ledger_index?: number; meta?: { TransactionResult?: string } };
          if (result?.validated) {
            submitResult = {
              ...submitResult,
              validated: true,
              ledgerIndex: result.ledger_index,
              engineResult: result.meta?.TransactionResult || submitResult?.engineResult,
            };
            break;
          }
        }
      } else {
        const submit = await xrplRequest<{ engine_result: string }>('submit', [{ tx_blob: signed.tx_blob }]);
        const engineResult = submit.engine_result;
        submitResult = {
          engineResult,
          accepted: engineResult?.startsWith('tes') ?? false,
        };
      }
    }

    return Response.json(
      {
        success: true,
        signedBlob: signed.tx_blob,
        hash,
        submitResult,
      } as TerSignResponse,
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign TER memo',
      } as TerSignResponse,
      { status: 500 }
    );
  } finally {
    // no websocket client to disconnect
  }
}
