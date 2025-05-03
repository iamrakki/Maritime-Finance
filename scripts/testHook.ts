/**
 * Test Hook Demo Script
 *
 * Run with: npx tsx scripts/testHook.ts
 */

import {
  sendPaymentThroughHook,
  runFullDemo,
  getCurrentBalances,
  HOOK_CONFIG,
} from '../src/lib/waterfall/hookDemo';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🪝 XRPL Hook Demo');
  console.log(`Hook: ${HOOK_CONFIG.hookAddress}`);
  console.log(`Target: ${HOOK_CONFIG.investorTarget} XRP\n`);

  if (command === 'balances') {
    // Show current balances
    console.log('📊 Current Balances:\n');
    const balances = await getCurrentBalances();
    console.log(`Charterer: ${balances.charterer.toFixed(2)} XRP`);
    console.log(`Investor:  ${balances.investor.toFixed(2)} XRP`);
    console.log(`Shipowner: ${balances.shipowner.toFixed(2)} XRP`);
    console.log(`Hook:      ${balances.platform.toFixed(2)} XRP`);
  } else if (command === 'pay') {
    // Send single payment
    const amount = parseFloat(args[1] || '250');
    const recovered = parseFloat(args[2] || '0');

    console.log(`💰 Sending ${amount} XRP payment (investor recovered: ${recovered} XRP)\n`);
    const result = await sendPaymentThroughHook(amount, recovered);

    console.log('\n📊 Result:');
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.message}`);
    console.log(`TX: ${result.chartererTxLink}`);
  } else if (command === 'demo' || !command) {
    // Run full demo
    console.log('🚀 Running Full Demo (3 payments)\n');
    const results = await runFullDemo();

    console.log('\n📊 Summary:');
    results.forEach((r, i) => {
      console.log(`\nPayment ${i + 1}: ${r.paymentAmount} XRP`);
      console.log(`  Expected: Investor ${r.expectedToInvestor} XRP, Shipowner ${r.expectedToShipowner} XRP`);
      if (r.actualToInvestor !== undefined) {
        console.log(`  Actual:   Investor ${r.actualToInvestor.toFixed(2)} XRP, Shipowner ${r.actualToShipowner!.toFixed(2)} XRP`);
      }
      console.log(`  Status: ${r.status}`);
      console.log(`  TX: ${r.chartererTxLink}`);
    });
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/testHook.ts              # Run full demo');
    console.log('  npx tsx scripts/testHook.ts demo         # Run full demo');
    console.log('  npx tsx scripts/testHook.ts pay 250 0    # Pay 250 XRP (0 recovered so far)');
    console.log('  npx tsx scripts/testHook.ts balances     # Show wallet balances');
  }
}

main().catch(console.error);
