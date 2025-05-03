/**
 * Credential Issuance Frontend Logic
 * Orchestrates the full credential issuance flow:
 * 1. Upload documents to mock IPFS
 * 2. Issue credential (browser connects to XRPL, server signs offline, browser submits)
 * 3. Accept credential (user signs CredentialAccept with Crossmark)
 *
 * IMPORTANT: Crossmark is a smart wallet - send "naked" transactions only!
 * No autofill needed - Crossmark handles Sequence, Fee, LastLedgerSequence automatically.
 *
 * For CredentialCreate: We use hybrid approach - server signs offline, browser submits
 * This avoids WebSocket issues in serverless environments.
 */

import { signAndSubmitCredentialWithCrossmark } from './credential-submit';
import {
  connectAndGetAccountInfo,
  submitSignedBlob,
  disconnectClient,
} from './xrpl-browser-client';

export interface IssueCredentialParams {
  userAddress: string;
  companyInfo: {
    companyName: string;
    registrationNumber: string;
    countryOfIncorporation: string;
    contactEmail: string;
  };
  ipfsCid: string;
}

export interface IssueCredentialResult {
  success: boolean;
  credentialId?: string;
  createTxHash?: string;
  acceptTxHash?: string;
  error?: string;
}

/**
 * Full credential issuance flow (Hybrid: Server-Sign, Browser-Submit)
 * 1. Browser connects to XRPL and fetches issuer's sequence number
 * 2. Server signs transaction offline (no XRPL connection needed)
 * 3. Browser submits the pre-signed blob to XRPL
 * 4. Accept credential (user signs CredentialAccept with Crossmark)
 *
 * @param params - User address, company info, and IPFS CID
 * @param issuerAddress - The issuer's XRPL address (fetched from server)
 * @returns Result with credential ID and transaction hashes
 */
export async function issueCredential(
  params: IssueCredentialParams,
  issuerAddress: string
): Promise<IssueCredentialResult> {
  let xrplClient: Awaited<ReturnType<typeof connectAndGetAccountInfo>>['client'] | null = null;

  try {
    console.log('[Credential] Starting issuance flow (hybrid approach)...');
    console.log('[Credential] User address:', params.userAddress);
    console.log('[Credential] Issuer address:', issuerAddress);
    console.log('[Credential] IPFS CID:', params.ipfsCid);

    // Step 1: Browser connects to XRPL and fetches issuer's account info
    console.log('[Credential] Step 1: Connecting to XRPL and fetching issuer sequence...');

    const { client, accountInfo } = await connectAndGetAccountInfo(issuerAddress);
    xrplClient = client;

    console.log('[Credential] Connected! Issuer sequence:', accountInfo.sequence);
    console.log('[Credential] Last ledger sequence:', accountInfo.lastLedgerSequence);

    // Step 2: Server signs the transaction offline
    console.log('[Credential] Step 2: Requesting server to sign transaction offline...');

    const signResponse = await fetch('/api/credential/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: params.userAddress,
        companyInfo: params.companyInfo,
        ipfsCid: params.ipfsCid,
        sequence: accountInfo.sequence,
        lastLedgerSequence: accountInfo.lastLedgerSequence,
      }),
    });

    if (!signResponse.ok) {
      const errorData = await signResponse.json();
      throw new Error(errorData.error || 'Failed to sign credential');
    }

    const signResult = await signResponse.json();

    if (!signResult.success || !signResult.signedBlob) {
      throw new Error(signResult.error || 'Credential signing failed');
    }

    console.log('[Credential] Transaction signed by server');
    console.log('[Credential] Hash:', signResult.hash);

    // Step 3: Browser submits the pre-signed blob to XRPL
    console.log('[Credential] Step 3: Submitting signed blob to XRPL...');

    const submitResult = await submitSignedBlob(xrplClient, signResult.signedBlob);

    if (!submitResult.success) {
      throw new Error(submitResult.error || 'Failed to submit CredentialCreate');
    }

    console.log('[Credential] CredentialCreate submitted successfully');
    console.log('[Credential] Engine result:', submitResult.engineResult);

    // Generate credential ID
    const credentialId = `CRED-${Date.now()}-${params.userAddress.substring(0, 8)}`;

    // Disconnect XRPL client before Crossmark step
    await disconnectClient(xrplClient);
    xrplClient = null;

    // Step 4: Build CredentialAccept transaction (naked - no Sequence/Fee/etc)
    console.log('[Credential] Step 4: Building naked CredentialAccept transaction...');

    const acceptResponse = await fetch('/api/credential/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: params.userAddress,
      }),
    });

    if (!acceptResponse.ok) {
      const errorData = await acceptResponse.json();
      throw new Error(errorData.error || 'Failed to build accept transaction');
    }

    const acceptResult = await acceptResponse.json();

    if (!acceptResult.success || !acceptResult.transaction) {
      throw new Error(acceptResult.error || 'Accept transaction build failed');
    }

    console.log('[Credential] CredentialAccept transaction built (naked)');
    console.log('[Credential] Transaction:', acceptResult.transaction);

    // Step 5: Sign and submit with Crossmark (NO autofill needed!)
    console.log('[Credential] Step 5: Sending to Crossmark signAndSubmit...');

    const crossmarkResult = await signAndSubmitCredentialWithCrossmark(acceptResult.transaction);

    if (!crossmarkResult.success) {
      throw new Error(crossmarkResult.error || 'Failed to accept credential');
    }

    console.log('[Credential] CredentialAccept submitted successfully');
    console.log('[Credential] Accept transaction hash:', crossmarkResult.transactionHash);

    console.log('[Credential] Credential issuance complete!');

    return {
      success: true,
      credentialId,
      createTxHash: signResult.hash,
      acceptTxHash: crossmarkResult.transactionHash,
    };
  } catch (error) {
    console.error('[Credential] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Credential issuance failed',
    };
  } finally {
    // Always cleanup XRPL connection
    if (xrplClient) {
      await disconnectClient(xrplClient);
    }
  }
}

/**
 * Upload documents to mock IPFS
 * Returns a fake CID for demo purposes
 *
 * @param certificateFile - Certificate of incorporation file
 * @param registryFile - Registry extract file
 * @param companyInfo - Company information
 * @returns Result with IPFS CID
 */
export async function uploadDocuments(
  certificateFile: File,
  registryFile: File,
  companyInfo: {
    companyName: string;
    registrationNumber: string;
    countryOfIncorporation: string;
    contactEmail: string;
  }
): Promise<{ success: boolean; cid?: string; error?: string }> {
  try {
    console.log('[IPFS] Uploading documents...');
    console.log('[IPFS] Certificate file:', certificateFile.name, certificateFile.size, 'bytes');
    console.log('[IPFS] Registry file:', registryFile.name, registryFile.size, 'bytes');

    const formData = new FormData();
    formData.append('certificateOfIncorporation', certificateFile);
    formData.append('registryExtract', registryFile);
    formData.append('companyInfo', JSON.stringify(companyInfo));

    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('[IPFS] Documents uploaded successfully');
    console.log('[IPFS] CID:', result.cid);

    return {
      success: true,
      cid: result.cid,
    };
  } catch (error) {
    console.error('[IPFS] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
