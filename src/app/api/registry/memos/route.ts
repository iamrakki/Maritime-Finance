/**
 * GET /api/registry/memos
 * Returns registry wallet memo history.
 */

import { Wallet } from 'xrpl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const XRPL_TESTNET_HTTP = 'https://s.altnet.rippletest.net:51234';

type RegistryMemo = {
  txHash: string;
  createdAt: string;
  memoHex: string;
  memoTypeHex?: string;
  memoFormatHex?: string;
  ledgerStatus?: string;
};

type AccountTxResponse = {
  transactions: Array<{
    tx?: {
      hash?: string;
      date?: number;
      Memos?: Array<{
        Memo?: {
          MemoData?: string;
          MemoType?: string;
          MemoFormat?: string;
        };
      }>;
    };
    tx_hash?: string;
    meta?: {
      TransactionResult?: string;
    };
  }>;
};

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

async function xrplRequest<T>(method: string, params?: unknown[]): Promise<T> {
  const response = await fetch(XRPL_TESTNET_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });

  if (!response.ok) {
    throw new Error(`XRPL HTTP error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_message || data.error?.message || 'XRPL request failed');
  }

  return data.result as T;
}

function rippleTimeToIso(rippleSeconds?: number): string {
  if (typeof rippleSeconds !== 'number' || !Number.isFinite(rippleSeconds)) {
    return new Date(0).toISOString();
  }
  const unixSeconds = rippleSeconds + 946684800;
  return new Date(unixSeconds * 1000).toISOString();
}

export async function GET(): Promise<Response> {
  try {
    const registrySeed = process.env.REGISTRY_SEED;
    if (!registrySeed) {
      return Response.json(
        { success: false, error: 'REGISTRY_SEED not configured in environment variables' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    if (!registrySeed.startsWith('s')) {
      return Response.json(
        { success: false, error: 'Invalid REGISTRY_SEED format. XRPL seeds must start with "s"' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    const registryWallet = Wallet.fromSeed(registrySeed);
    const accountTx = await xrplRequest<AccountTxResponse>('account_tx', [
      {
        account: registryWallet.address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        forward: false,
      },
    ]);

    const memos: RegistryMemo[] = [];
    for (const entry of accountTx.transactions || []) {
      const tx = entry.tx;
      const memo = tx?.Memos?.[0]?.Memo;
      const memoHex = memo?.MemoData;
      if (!memoHex) {
        continue;
      }
      const txHash = tx?.hash || entry.tx_hash || '';
      if (!txHash) {
        continue;
      }
      memos.push({
        txHash,
        createdAt: rippleTimeToIso(tx?.date),
        memoHex,
        memoTypeHex: memo?.MemoType,
        memoFormatHex: memo?.MemoFormat,
        ledgerStatus: entry.meta?.TransactionResult,
      });
    }

    return Response.json(
      { success: true, memos },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load memos' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
