#!/usr/bin/env node

/**
 * Platform Wallet Credential Issuer Script
 *
 * This script demonstrates how the platform wallet issues KYC_VERIFIED credentials
 * to users after verifying their documents.
 *
 * Usage:
 *   npx ts-node scripts/issue-credential.ts <userAddress> <companyName> <ipfsCid>
 *
 * Example:
 *   npx ts-node scripts/issue-credential.ts rN7n7otQDd6FczFgLdlqtyMVrn3HMfXy2S "ACME Corp" QmXXXXXXXX
 */

import { Client, Wallet } from 'xrpl';

// Convert string to hex using Buffer
function toHex(str: string): string {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}

// Platform issuer wallet (from environment or hardcoded for demo)
const ISSUER_SEED = process.env.ISSUER_SEED || 'sEdSdjk62eTxTzrdqh5mx8cw2Y2zhr9';
const TESTNET_ENDPOINT = 'wss://s.altnet.rippletest.net:51234';

// Credential type - must match what the user accepts
const CREDENTIAL_TYPE = toHex('KYC_VERIFIED');

/**
 * Issue a KYC_VERIFIED credential to a user
 */
async function issueKYCCredential(
  userAddress: string,
  companyName: string,
  ipfsCid: string,
  companyData?: Record<string, unknown>
): Promise<{
  success: boolean;
  credentialId?: string;
  transactionHash?: string;
  error?: string;
}> {
  const client = new Client(TESTNET_ENDPOINT);

  try {
    console.log('\n🔐 Platform Credential Issuer');
    console.log('=' .repeat(50));
    console.log(`User Address: ${userAddress}`);
    console.log(`Company: ${companyName}`);
    console.log(`IPFS CID: ${ipfsCid}`);

    // Connect to the ledger
    console.log('\n📡 Connecting to XRPL Testnet...');
    await client.connect();
    console.log('✓ Connected to testnet');

    // Initialize issuer wallet
    console.log('\n🔑 Loading issuer wallet...');
    const issuerWallet = Wallet.fromSeed(ISSUER_SEED);
    console.log(`✓ Issuer address: ${issuerWallet.address}`);

    // Build the CredentialCreate transaction
    console.log('\n📝 Building CredentialCreate transaction...');

    const credentialId = `CRED-${Date.now()}-${userAddress.slice(0, 8)}`;

    // Prepare company data for Data field
    const dataPayload = {
      companyName,
      verified: true,
      issuanceDate: new Date().toISOString(),
      ...companyData,
    };

    const transaction = {
      TransactionType: 'CredentialCreate' as const,
      Account: issuerWallet.address,
      Subject: userAddress,
      CredentialType: CREDENTIAL_TYPE,
      URI: toHex(`ipfs://${ipfsCid}`),
      Data: toHex(JSON.stringify(dataPayload)),
      Fee: '12', // In drops: 0.000012 XRP
    };

    console.log(`✓ Transaction built`);
    console.log(`  - Subject (User): ${userAddress}`);
    console.log(`  - Type: KYC_VERIFIED (hex: ${CREDENTIAL_TYPE})`);
    console.log(`  - URI: ipfs://${ipfsCid}`);
    console.log(`  - Fee: 12 drops`);

    // Auto-fill (adds Sequence, LastLedgerSequence)
    console.log('\n🔄 Auto-filling transaction details...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autofilled = await client.autofill(transaction as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autofilledAny = autofilled as any;
    console.log(`✓ Sequence: ${autofilledAny.Sequence}`);
    console.log(`✓ LastLedgerSequence: ${autofilledAny.LastLedgerSequence}`);

    // Sign with issuer wallet
    console.log('\n✍️  Signing with issuer wallet...');
    const signed = issuerWallet.sign(autofilled);
    console.log(`✓ Signed`);
    console.log(`  TX Blob: ${signed.tx_blob.substring(0, 20)}...`);

    // Submit to ledger
    console.log('\n📤 Submitting to ledger...');
    const result = await client.submitAndWait(signed.tx_blob);

    const meta = (result.result as any).meta;
    const txResult = meta?.TransactionResult || 'Unknown';
    const txHash = (result.result as any).hash;

    console.log(`✓ Submitted!`);
    console.log(`  - Transaction Hash: ${txHash}`);
    console.log(`  - Result: ${txResult}`);

    if (txResult === 'tesSUCCESS') {
      console.log('\n✅ Credential issued successfully!');
      console.log(`\nCredential Details:`);
      console.log(`  ID: ${credentialId}`);
      console.log(`  Issuer: ${issuerWallet.address}`);
      console.log(`  Subject: ${userAddress}`);
      console.log(`  Type: KYC_VERIFIED`);
      console.log(`  Status: Active (On-Chain)`);

      await client.disconnect();

      return {
        success: true,
        credentialId,
        transactionHash: txHash,
      };
    } else {
      const error = `Transaction failed: ${txResult}`;
      console.error(`\n❌ ${error}`);

      await client.disconnect();

      return {
        success: false,
        error,
      };
    }
  } catch (error) {
    console.error('\n❌ Error issuing credential:', error);

    await client.disconnect();

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// CLI entry point
async function main() {
  const [, , userAddress, companyName, ipfsCid] = process.argv;

  if (!userAddress || !companyName || !ipfsCid) {
    console.error('Usage: npx ts-node scripts/issue-credential.ts <userAddress> <companyName> <ipfsCid>');
    console.error('');
    console.error('Example:');
    console.error(
      '  npx ts-node scripts/issue-credential.ts rN7n7otQDd6FczFgLdlqtyMVrn3HMfXy2S "ACME Corp" QmABC123'
    );
    process.exit(1);
  }

  const result = await issueKYCCredential(userAddress, companyName, ipfsCid, {
    registrationNumber: 'DEMO-2025-001',
    countryOfIncorporation: 'Singapore',
    contactEmail: 'demo@example.com',
  });

  process.exit(result.success ? 0 : 1);
}

main();
