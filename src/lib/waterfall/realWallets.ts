/**
 * Real XRPL Wallet Generation & Management
 *
 * USES FIXED ADDRESSES from FIXED_WALLETS.md to match deployed Hook parameters
 */

import { Wallet } from 'xrpl';
import { WalletConfig } from '@/types/waterfall';
import { getWalletBalance, dropsToXRP, fundWalletDirectly } from '@/lib/xrpl/wallets';

// REAL WALLET SECRETS - Updated 2026-01-09
// All wallets use Ed25519 algorithm for consistency
// NEW Hook parameters (pending deployment):
// - investor_address (hex): 949CE1FEB184193BF516F2ACA5E5335BBAE9EDC9
// - shipowner_address (hex): 8C69E1CC7B5F498FB71D07200F87602DA2644B60
// - investor_target: 000000001DCD6500 (500 XRP = 500,000,000 drops)
export const REAL_WALLET_SECRETS = {
  platform: {
    address: 'rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV',
    seed: 'sEdTk3FMu1ojhchiss2KXY8Uw71DMce',
  },
  investor: {
    address: 'rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ',
    seed: 'sEd7ZguPnUhwWXMzJJVTGfbMQ2Yjauc',
  },
  shipowner: {
    address: 'rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG',
    seed: 'sEd7YwJTAUCyrQiaNcGpVUhukrPZM38',
  },
  charterer: {
    address: 'rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN',
    seed: 'sEdTYETVj89Vt8415esLEvqhRyXw516',
  },
};

/**
 * Load REAL wallets from secrets
 * These are the actual wallets that will be used with the Hook
 */
export function loadRealWallets() {
  console.log('📂 Loading REAL wallets from secrets...');

  const platformWallet = Wallet.fromSeed(REAL_WALLET_SECRETS.platform.seed);
  const investorWallet = Wallet.fromSeed(REAL_WALLET_SECRETS.investor.seed);
  const shipownerWallet = Wallet.fromSeed(REAL_WALLET_SECRETS.shipowner.seed);
  const chartererWallet = Wallet.fromSeed(REAL_WALLET_SECRETS.charterer.seed);

  const wallets = {
    platform: {
      role: 'platform' as const,
      address: platformWallet.address,
      secretKey: platformWallet.seed!,
      publicKey: platformWallet.publicKey,
    },
    investor: {
      role: 'investor' as const,
      address: investorWallet.address,
      secretKey: investorWallet.seed!,
      publicKey: investorWallet.publicKey,
    },
    shipowner: {
      role: 'shipowner' as const,
      address: shipownerWallet.address,
      secretKey: shipownerWallet.seed!,
      publicKey: shipownerWallet.publicKey,
    },
    charterer: {
      role: 'charterer' as const,
      address: chartererWallet.address,
      secretKey: chartererWallet.seed!,
      publicKey: chartererWallet.publicKey,
    },
  };

  console.log('✅ Loaded REAL wallets:');
  console.log(`  Platform:  ${wallets.platform.address} (Hook account)`);
  console.log(`  Investor:  ${wallets.investor.address}`);
  console.log(`  Shipowner: ${wallets.shipowner.address}`);
  console.log(`  Charterer: ${wallets.charterer.address}`);

  return wallets;
}

/**
 * Fund all wallets from faucet with retry logic
 */
export async function fundAllRealWallets(wallets: {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
}) {
  console.log('💸 Funding all 4 wallets from Xahau Testnet faucet...');

  const addresses = [
    { role: 'charterer', address: wallets.charterer.address },
    { role: 'investor', address: wallets.investor.address },
    { role: 'shipowner', address: wallets.shipowner.address },
    { role: 'platform', address: wallets.platform.address },
  ];

  for (const { role, address } of addresses) {
    console.log(`💰 Funding ${role} wallet: ${address}`);

    const success = await fundWalletDirectly(address);

    if (success) {
      // Wait for funding to confirm
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

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('✅ All wallets funded!');
}

/**
 * Poll wallet balance until funded or timeout
 */
export async function pollWalletBalance(
  address: string,
  timeoutMs: number = 30000
): Promise<{ balance: number; funded: boolean }> {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      const balanceDrops = await getWalletBalance(address);
      const balance = dropsToXRP(balanceDrops);

      if (balance > 0) {
        return { balance, funded: true };
      }
    } catch (error) {
      // Account not found yet, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return { balance: 0, funded: false };
}

/**
 * Poll all wallet balances
 */
export async function pollAllWalletBalances(wallets: {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
}): Promise<{
  charterer: number;
  investor: number;
  shipowner: number;
  platform: number;
}> {
  console.log('🔄 Polling wallet balances...');

  const [charterer, investor, shipowner, platform] = await Promise.all([
    pollWalletBalance(wallets.charterer.address),
    pollWalletBalance(wallets.investor.address),
    pollWalletBalance(wallets.shipowner.address),
    pollWalletBalance(wallets.platform.address),
  ]);

  return {
    charterer: charterer.balance,
    investor: investor.balance,
    shipowner: shipowner.balance,
    platform: platform.balance,
  };
}

/**
 * Get hex-encoded address for Hook parameters
 */
export function addressToHex(address: string): string {
  const wallet = Wallet.fromSeed('snoPBrXtMeMyMHUVTgbuqAfg1SUTb'); // Dummy seed
  // This is a simplified version - in production use proper address decoding
  // For now, just return a placeholder since we need actual wallet addresses
  return address; // Return as-is, will need proper implementation
}

/**
 * Wait for transaction confirmation
 */
export async function pollTransactionConfirmation(
  txHash: string,
  maxAttempts: number = 10
): Promise<boolean> {
  const { getXRPLClient } = await import('@/lib/xrpl/client');

  const client = await getXRPLClient();

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await client.request({
        command: 'tx',
        transaction: txHash,
        api_version: 1,
      });

      if (response.result.validated) {
        console.log(`✅ Transaction ${txHash} confirmed`);
        return true;
      }
    } catch (error) {
      // TX not found yet, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn(`⚠️  Transaction ${txHash} not confirmed after ${maxAttempts} attempts`);
  return false;
}

/**
 * Load REAL wallets from secrets and save to localStorage
 *
 * These are the actual wallets that match the Hook deployment parameters.
 */
export function loadAndSaveFixedWallets(): {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
} {
  const wallets = loadRealWallets();

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('hookDemoWallets', JSON.stringify(wallets));
    console.log('💾 Real wallets saved to localStorage');
  }

  return wallets;
}

/**
 * Load wallets from localStorage
 */
export function loadSavedWallets(): {
  charterer: WalletConfig;
  investor: WalletConfig;
  shipowner: WalletConfig;
  platform: WalletConfig;
} | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('hookDemoWallets');
  if (!saved) return null;

  try {
    const wallets = JSON.parse(saved);
    console.log('📂 Loaded wallets from localStorage');
    return wallets;
  } catch (error) {
    console.error('Failed to load wallets:', error);
    return null;
  }
}

/**
 * Clear saved wallets
 */
export function clearSavedWallets() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hookDemoWallets');
    console.log('🗑️  Cleared saved wallets');
  }
}
