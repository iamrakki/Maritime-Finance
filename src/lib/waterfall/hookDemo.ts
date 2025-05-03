/**
 * Hook Demo - Direct integration with deployed XRPL Hook
 *
 * Demonstrates waterfall distribution enforcement on-chain
 */

import { sendXRP } from '@/lib/xrpl/transactions';
import { getWalletBalance, dropsToXRP } from '@/lib/xrpl/wallets';
import { WalletConfig } from '@/types/waterfall';

// FIXED WALLETS - Match FIXED_WALLETS.md
export const FIXED_WALLETS = {
  platform: {
    role: 'platform' as const,
    address: 'rBVEchNr4DzKAwZcaAs3N6MWrLCp5FHBZZ',
    secretKey: 'snYv9MFL2EfVR9nBmEjAHbXhqhU3u',
    publicKey: '03A4C8A1F8F4E4B4E1A7D5C2B3F6E7D8C9A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5',
  },
  investor: {
    role: 'investor' as const,
    address: 'rKm3UyP7TfeGHsNwqKauKb1DAQ7Yitd3vw',
    secretKey: 'sp5fM7Cw2Tt6JZvuX1Qh3Nn8Rk9Yz4Vb',
    publicKey: '02B5D7F8A9C1E2D3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6',
  },
  shipowner: {
    role: 'shipowner' as const,
    address: 'rw2UaYq5Z7bK3pL9mN4vD8sF6jR1eT2cX5',
    secretKey: 'ss8hN2Vr5Kx7Pm9Qw3Tf6Zl4Jc1Yb8Md',
    publicKey: '03C6E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7',
  },
  charterer: {
    role: 'charterer' as const,
    address: 'rPt7MnE3zK9wL2xC4vB6yD8aF1sG5hJ0qN',
    secretKey: 'spKj7Rt3Yx5Nm8Wq2Lp6Zv4Tc9Hb1Fd',
    publicKey: '02D7F9A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9',
  },
};

// Hook parameters (from deployment)
export const HOOK_CONFIG = {
  hookAddress: FIXED_WALLETS.platform.address, // Hook is installed on platform wallet
  investorTarget: 500, // 500 XRP (investor principal + interest)
  investorTargetDrops: 500_000_000, // 500 XRP in drops
};

export interface HookDemoResult {
  chartererTxHash: string;
  chartererTxLink: string;
  paymentAmount: number;
  expectedToInvestor: number;
  expectedToShipowner: number;
  investorBalanceBefore: number;
  shipownerBalanceBefore: number;
  investorBalanceAfter?: number;
  shipownerBalanceAfter?: number;
  actualToInvestor?: number;
  actualToShipowner?: number;
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
}

/**
 * Calculate expected waterfall distribution
 */
export function calculateExpectedDistribution(
  paymentAmount: number,
  investorRecoveredSoFar: number
): { toInvestor: number; toShipowner: number; newRecovered: number } {
  const remaining = HOOK_CONFIG.investorTarget - investorRecoveredSoFar;

  if (remaining <= 0) {
    // Investor fully recovered - all to shipowner
    return {
      toInvestor: 0,
      toShipowner: paymentAmount,
      newRecovered: investorRecoveredSoFar,
    };
  }

  if (paymentAmount >= remaining) {
    // Payment covers investor fully
    return {
      toInvestor: remaining,
      toShipowner: paymentAmount - remaining,
      newRecovered: HOOK_CONFIG.investorTarget,
    };
  } else {
    // Payment doesn't cover investor fully
    return {
      toInvestor: paymentAmount,
      toShipowner: 0,
      newRecovered: investorRecoveredSoFar + paymentAmount,
    };
  }
}

/**
 * Send payment through Hook - demonstrates waterfall distribution
 */
export async function sendPaymentThroughHook(
  paymentAmount: number,
  investorRecoveredSoFar: number = 0
): Promise<HookDemoResult> {
  console.log('\n🎯 HOOK DEMO: Charterer → Hook → Waterfall Distribution');
  console.log(`💰 Payment: ${paymentAmount} XRP`);
  console.log(`📊 Investor recovered so far: ${investorRecoveredSoFar} XRP`);

  // Calculate expected distribution
  const expected = calculateExpectedDistribution(paymentAmount, investorRecoveredSoFar);
  console.log(`\n📈 Expected Distribution:`);
  console.log(`   → Investor: ${expected.toInvestor} XRP`);
  console.log(`   → Shipowner: ${expected.toShipowner} XRP`);
  console.log(`   → New investor total: ${expected.newRecovered} XRP`);

  // Get balances BEFORE payment
  const investorBalanceDropsBefore = await getWalletBalance(FIXED_WALLETS.investor.address);
  const shipownerBalanceDropsBefore = await getWalletBalance(FIXED_WALLETS.shipowner.address);
  const investorBalanceBefore = dropsToXRP(investorBalanceDropsBefore);
  const shipownerBalanceBefore = dropsToXRP(shipownerBalanceDropsBefore);

  console.log(`\n💼 Balances BEFORE:`);
  console.log(`   Investor: ${investorBalanceBefore.toFixed(2)} XRP`);
  console.log(`   Shipowner: ${shipownerBalanceBefore.toFixed(2)} XRP`);

  try {
    // SINGLE TRANSACTION: Charterer → Hook
    console.log(`\n📤 Sending ${paymentAmount} XRP from Charterer to Hook...`);
    const chartererTx = await sendXRP(
      FIXED_WALLETS.charterer,
      HOOK_CONFIG.hookAddress,
      paymentAmount,
      'charterer_payment',
      `Voyage payment: ${paymentAmount} XRP`
    );

    const explorerBase = 'https://explorer.xahau-test.net';
    const chartererTxLink = `${explorerBase}/transactions/${chartererTx.hash}`;

    console.log(`✅ Charterer TX confirmed: ${chartererTx.hash}`);
    console.log(`🔗 ${chartererTxLink}`);

    const result: HookDemoResult = {
      chartererTxHash: chartererTx.hash!,
      chartererTxLink,
      paymentAmount,
      expectedToInvestor: expected.toInvestor,
      expectedToShipowner: expected.toShipowner,
      investorBalanceBefore,
      shipownerBalanceBefore,
      status: 'pending',
      message: 'Payment sent to Hook. Waiting for Hook execution...',
    };

    // Wait for Hook execution (Hook will emit 2 transactions automatically)
    console.log(`\n⚡ Hook executing waterfall distribution...`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds for Hook + emitted TXs

    // Get balances AFTER Hook execution
    const investorBalanceDropsAfter = await getWalletBalance(FIXED_WALLETS.investor.address);
    const shipownerBalanceDropsAfter = await getWalletBalance(FIXED_WALLETS.shipowner.address);
    const investorBalanceAfter = dropsToXRP(investorBalanceDropsAfter);
    const shipownerBalanceAfter = dropsToXRP(shipownerBalanceDropsAfter);

    // Calculate actual amounts received
    const actualToInvestor = investorBalanceAfter - investorBalanceBefore;
    const actualToShipowner = shipownerBalanceAfter - shipownerBalanceBefore;

    console.log(`\n💼 Balances AFTER:`);
    console.log(`   Investor: ${investorBalanceAfter.toFixed(2)} XRP (+${actualToInvestor.toFixed(2)})`);
    console.log(`   Shipowner: ${shipownerBalanceAfter.toFixed(2)} XRP (+${actualToShipowner.toFixed(2)})`);

    // Verify Hook executed correctly
    const investorMatch = Math.abs(actualToInvestor - expected.toInvestor) < 0.01;
    const shipownerMatch = Math.abs(actualToShipowner - expected.toShipowner) < 0.01;

    result.investorBalanceAfter = investorBalanceAfter;
    result.shipownerBalanceAfter = shipownerBalanceAfter;
    result.actualToInvestor = actualToInvestor;
    result.actualToShipowner = actualToShipowner;
    result.status = 'confirmed';

    if (investorMatch && shipownerMatch) {
      result.message = '✅ Hook executed waterfall distribution correctly!';
      console.log(`\n✅ Hook executed waterfall distribution correctly!`);
    } else {
      result.message = `⚠️ Distribution mismatch. Expected: ${expected.toInvestor}/${expected.toShipowner}, Got: ${actualToInvestor}/${actualToShipowner}`;
      console.log(`\n⚠️ Distribution mismatch detected`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Payment failed:', error);

    return {
      chartererTxHash: '',
      chartererTxLink: '',
      paymentAmount,
      expectedToInvestor: expected.toInvestor,
      expectedToShipowner: expected.toShipowner,
      investorBalanceBefore,
      shipownerBalanceBefore,
      status: 'failed',
      message: `Failed: ${error.message}`,
    };
  }
}

/**
 * Run full demo scenario
 */
export async function runFullDemo(): Promise<HookDemoResult[]> {
  console.log('🚀 Starting Full Waterfall Demo');
  console.log(`🪝 Hook Address: ${HOOK_CONFIG.hookAddress}`);
  console.log(`🎯 Investor Target: ${HOOK_CONFIG.investorTarget} XRP\n`);

  const results: HookDemoResult[] = [];
  let investorRecovered = 0;

  // Payment 1: 250 XRP (partial recovery)
  console.log('═══════════════════════════════════════');
  console.log('PAYMENT 1: 250 XRP');
  console.log('═══════════════════════════════════════');
  const result1 = await sendPaymentThroughHook(250, investorRecovered);
  results.push(result1);
  investorRecovered += result1.actualToInvestor || result1.expectedToInvestor;

  // Wait between payments
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Payment 2: 300 XRP (completes investor recovery + shipowner remainder)
  console.log('\n═══════════════════════════════════════');
  console.log('PAYMENT 2: 300 XRP');
  console.log('═══════════════════════════════════════');
  const result2 = await sendPaymentThroughHook(300, investorRecovered);
  results.push(result2);
  investorRecovered += result2.actualToInvestor || result2.expectedToInvestor;

  // Wait between payments
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Payment 3: 200 XRP (all to shipowner)
  console.log('\n═══════════════════════════════════════');
  console.log('PAYMENT 3: 200 XRP (Investor fully recovered)');
  console.log('═══════════════════════════════════════');
  const result3 = await sendPaymentThroughHook(200, investorRecovered);
  results.push(result3);

  console.log('\n═══════════════════════════════════════');
  console.log('DEMO COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`Total investor recovered: ${investorRecovered} XRP`);
  console.log(`Target achieved: ${investorRecovered >= HOOK_CONFIG.investorTarget ? 'YES ✅' : 'NO'}`);

  return results;
}

/**
 * Get current wallet balances
 */
export async function getCurrentBalances() {
  const [charterer, investor, shipowner, platform] = await Promise.all([
    getWalletBalance(FIXED_WALLETS.charterer.address),
    getWalletBalance(FIXED_WALLETS.investor.address),
    getWalletBalance(FIXED_WALLETS.shipowner.address),
    getWalletBalance(FIXED_WALLETS.platform.address),
  ]);

  return {
    charterer: dropsToXRP(charterer),
    investor: dropsToXRP(investor),
    shipowner: dropsToXRP(shipowner),
    platform: dropsToXRP(platform),
  };
}
