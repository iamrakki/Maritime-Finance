/**
 * TER memo signing flow using registry seed on the server.
 */

import { validateTerMemo, type TerMemo } from './ter-memo';

interface SubmitResult {
  engineResult?: string;
  accepted?: boolean;
  validated?: boolean;
  ledgerIndex?: number;
  error?: string;
}

export interface TerMemoSignOptions {
  submit?: boolean;
  waitForValidation?: boolean;
}

export interface TerMemoSignResult {
  success: boolean;
  signedBlob?: string;
  hash?: string;
  submitResult?: SubmitResult;
  error?: string;
}

/**
 * Build a TER memo transaction, sign with Crossmark, and optionally submit.
 */
export async function signTerMemoWithRegistry(
  memo: TerMemo,
  options: TerMemoSignOptions = {}
): Promise<TerMemoSignResult> {
  const validation = validateTerMemo(memo);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  const response = await fetch('/api/ter/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memo,
      submit: options.submit,
      waitForValidation: options.waitForValidation,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    return { success: false, error: data.error || 'Failed to sign TER memo' };
  }

  return {
    success: true,
    signedBlob: data.signedBlob,
    hash: data.hash,
    submitResult: data.submitResult,
  };
}
