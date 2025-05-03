/**
 * TER memo schema and deterministic serialization.
 */

import { toHexLower } from './hex-utils';

export interface TerMemo {
  ter_id: string;
  voyage_id: string;
  registry_id: string;
  shipowner_id: string;
  charterer_id: string;
  amount: number;
  currency: string;
  rates: Record<string, number>;
  total_settlements: number;
  settlement_refs: string[];
  issued_at: string;
}

const TER_MEMO_FIELD_ORDER: Array<keyof TerMemo> = [
  'ter_id',
  'voyage_id',
  'registry_id',
  'shipowner_id',
  'charterer_id',
  'amount',
  'currency',
  'rates',
  'total_settlements',
  'settlement_refs',
  'issued_at',
];

const NUMERIC_FIELDS: Array<keyof TerMemo> = [
  'amount',
  'total_settlements',
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function orderedRates(rates: Record<string, number>): Record<string, number> {
  const ordered: Record<string, number> = {};
  for (const key of Object.keys(rates).sort()) {
    ordered[key] = rates[key];
  }
  return ordered;
}

function buildOrderedMemo(memo: TerMemo): TerMemo {
  const ordered = {} as TerMemo;
  for (const key of TER_MEMO_FIELD_ORDER) {
    if (key === 'rates') {
      ordered[key] = orderedRates(memo.rates) as TerMemo[typeof key];
      continue;
    }
    (ordered as any)[key] = memo[key];
  }
  return ordered;
}

export function getOrderedTerMemo(memo: TerMemo): TerMemo {
  return buildOrderedMemo(memo);
}

export function validateTerMemo(memo: unknown): { ok: boolean; error?: string } {
  if (!isPlainObject(memo)) {
    return { ok: false, error: 'TER memo must be an object' };
  }

  for (const key of TER_MEMO_FIELD_ORDER) {
    if (!(key in memo)) {
      return { ok: false, error: `Missing TER memo field: ${key}` };
    }
  }

  const memoRecord = memo as unknown as TerMemo;

  if (!Array.isArray(memoRecord.settlement_refs)) {
    return { ok: false, error: 'settlement_refs must be an array' };
  }

  if (!memoRecord.settlement_refs.every(ref => typeof ref === 'string')) {
    return { ok: false, error: 'settlement_refs must contain strings' };
  }

  if (memoRecord.settlement_refs.length !== memoRecord.total_settlements) {
    return { ok: false, error: 'settlement_refs length must equal total_settlements' };
  }

  for (const field of NUMERIC_FIELDS) {
    const value = memoRecord[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }

  if (!isPlainObject(memoRecord.rates)) {
    return { ok: false, error: 'rates must be an object' };
  }

  for (const [key, value] of Object.entries(memoRecord.rates)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, error: `rates.${key} must be a finite number` };
    }
    if (value < 0 || value > 1) {
      return { ok: false, error: `rates.${key} must be between 0 and 1` };
    }
  }

  const extraKeys = Object.keys(memoRecord).filter(
    key => !TER_MEMO_FIELD_ORDER.includes(key as keyof TerMemo)
  );
  if (extraKeys.length > 0) {
    return { ok: false, error: `Unexpected TER memo fields: ${extraKeys.join(', ')}` };
  }

  return { ok: true };
}

export function serializeTerMemo(memo: TerMemo): { memoJson: string; memoDataHex: string } {
  const orderedMemo = buildOrderedMemo(memo);
  const memoJson = JSON.stringify(orderedMemo);
  const memoDataHex = toHexLower(memoJson);
  return { memoJson, memoDataHex };
}
