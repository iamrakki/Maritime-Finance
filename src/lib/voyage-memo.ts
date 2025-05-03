/**
 * Voyage memo builder for registry-signed XRPL transactions.
 */

import { createHash } from 'crypto';
import { toHex } from './hex-utils';

export interface VoyageRecord {
  voyageId: string;
  vesselId: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalEta: string;
  [key: string]: unknown;
}

export interface VoyageMemoPayload {
  type: 'VOYAGE_REGISTRY';
  registryAddress: string;
  voyageId: string;
  vesselId: string;
  hash: string;
  hashAlg: 'SHA-256';
  timestamp: string;
  note?: string;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries = keys.map(key => `"${key}":${stableStringify(record[key])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

export function buildVoyageMemo(
  voyage: VoyageRecord,
  registryAddress: string,
  note?: string
): {
  canonical: string;
  hash: string;
  payload: VoyageMemoPayload;
  memoDataHex: string;
} {
  const canonical = stableStringify(voyage);
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex');

  const payload: VoyageMemoPayload = {
    type: 'VOYAGE_REGISTRY',
    registryAddress,
    voyageId: voyage.voyageId,
    vesselId: voyage.vesselId,
    hash,
    hashAlg: 'SHA-256',
    timestamp: new Date().toISOString(),
    ...(note ? { note } : {}),
  };

  return {
    canonical,
    hash,
    payload,
    memoDataHex: toHex(JSON.stringify(payload)),
  };
}
