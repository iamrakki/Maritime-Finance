/**
 * XRPL Wallet Management
 *
 * Functions for creating, loading, and managing XRPL wallets
 */

import { Wallet, dropsToXrp } from 'xrpl';
import { WalletConfig, WalletRole } from '@/types/waterfall';
import { getXRPLClient } from './client';

/**
 * Create wallet from secret key
 */
export function createWalletFromSeed(secretKey: string, role: WalletRole): WalletConfig {
  try {
    const wallet = Wallet.fromSeed(secretKey);

    return {
      role,
      address: wallet.address,
      secretKey: wallet.seed!,
      publicKey: wallet.publicKey,
    };
  } catch (error) {
    console.error(`Failed to create wallet for ${role}:`, error);
    throw new Error(`Invalid secret key for ${role}`);
  }
}

/**
 * Get wallet balance from XRPL
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const client = await getXRPLClient();
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
      api_version: 1, // Xahau uses API version 1
    });

    return response.result.account_data.Balance;
  } catch (error: any) {
    if (error?.data?.error === 'actNotFound') {
      // Account not found - unfunded
      return '0';
    }
    console.error(`Failed to get balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Update wallet config with current balance
 */
export async function updateWalletBalance(wallet: WalletConfig): Promise<WalletConfig> {
  const balance = await getWalletBalance(wallet.address);
  return {
    ...wallet,
    balance,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update all wallet balances in parallel
 */
export async function updateAllWalletBalances(wallets: {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
}): Promise<typeof wallets> {
  const [charterer, investor, shipowner, platform] = await Promise.all([
    updateWalletBalance(wallets.charterer),
    updateWalletBalance(wallets.investor),
    updateWalletBalance(wallets.shipowner),
    updateWalletBalance(wallets.platform),
  ]);

  return { charterer, investor, shipowner, platform };
}

/**
 * Convert drops to XRP for display
 */
export function dropsToXRP(drops: string): number {
  return Number(drops) / 1_000_000;
}

/**
 * Convert XRP to drops for transactions
 */
export function xrpToDrops(xrp: number): string {
  return (xrp * 1_000_000).toString();
}

/**
 * Validate wallet address
 */
export function isValidAddress(address: string): boolean {
  // XRPL addresses start with 'r' and are 25-35 characters
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

/**
 * Generate a new XRPL wallet programmatically
 */
export function generateNewWallet(role: WalletRole): WalletConfig {
  const wallet = Wallet.generate();

  console.log(`🔑 Generated new wallet for ${role}:`, wallet.address);

  return {
    role,
    address: wallet.address,
    secretKey: wallet.seed!,
    publicKey: wallet.publicKey,
  };
}

/**
 * Generate all 4 wallets for waterfall simulation
 */
export function generateAllWallets(): {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
} {
  console.log('🎲 Generating 4 wallets for waterfall simulation...');

  return {
    charterer: generateNewWallet('charterer'),
    investor: generateNewWallet('investor'),
    shipowner: generateNewWallet('shipowner'),
    platform: generateNewWallet('platform'),
  };
}

/**
 * Fund wallet from Xahau Testnet faucet
 * Uses the xrpl.js fundWallet helper which handles testnet funding
 */
export async function fundWalletFromFaucet(address: string): Promise<void> {
  try {
    const client = await getXRPLClient();

    console.log(`💰 Funding wallet ${address} from Xahau Testnet faucet...`);

    // Use XRPL fundWallet which automatically detects and uses appropriate faucet
    const wallet = Wallet.generate(); // Temporary wallet for funding call
    const fundResult = await client.fundWallet(wallet);

    console.log('✅ Wallet funded successfully:', fundResult.wallet.address);
  } catch (error) {
    console.error('Failed to fund wallet from faucet:', error);
    throw new Error('Unable to fund wallet. Please use Xahau Testnet faucet manually.');
  }
}

/**
 * Fund wallet using direct HTTP request to Xahau Testnet faucet
 */
export async function fundWalletDirectly(address: string): Promise<boolean> {
  // Xahau Testnet faucet endpoint
  const faucetUrl = 'https://xahau-test.net/accounts';

  try {
    console.log(`💰 Requesting funds for ${address}...`);

    const response = await fetch(faucetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: address,
      }),
    });

    if (!response.ok) {
      console.warn('Faucet direct request failed, will retry...');
      return false;
    }

    const data = await response.json();
    console.log('✅ Funded wallet from faucet:', data);
    return true;
  } catch (error) {
    console.error('Failed to fund wallet directly:', error);
    return false;
  }
}

/**
 * Fund all wallets with retry logic and wait for confirmation
 */
export async function fundAllWallets(wallets: {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
}): Promise<void> {
  console.log('💸 Funding all 4 wallets from Xahau Testnet faucet...');

  const addresses = [
    { role: 'charterer', address: wallets.charterer.address },
    { role: 'investor', address: wallets.investor.address },
    { role: 'shipowner', address: wallets.shipowner.address },
    { role: 'platform', address: wallets.platform.address },
  ];

  // Fund wallets sequentially to avoid rate limiting
  for (const { role, address } of addresses) {
    console.log(`💰 Funding ${role} wallet...`);

    // Try direct HTTP request first
    const success = await fundWalletDirectly(address);

    if (success) {
      // Wait for funding to confirm (3-5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify funding
      const balance = await getWalletBalance(address);
      const xrpBalance = dropsToXRP(balance);

      if (xrpBalance > 0) {
        console.log(`✅ ${role} funded: ${xrpBalance.toFixed(2)} XRP`);
      } else {
        console.warn(`⚠️  ${role} funded but balance not yet visible`);
      }
    } else {
      console.warn(`⚠️  ${role} funding request failed`);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('✅ All wallets funded!');
}
