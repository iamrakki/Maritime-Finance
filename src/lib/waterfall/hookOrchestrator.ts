/**
 * Hook-Based Waterfall Payment Orchestrator
 *
 * Uses XRPL native hooks for trustless, single-transaction waterfall distribution
 */

import {
  FinancingAgreement,
  WaterfallTransaction,
  FinancingStatus,
} from '@/types/waterfall';
import { sendXRP } from '@/lib/xrpl/transactions';
import { updateWalletBalance } from '@/lib/xrpl/wallets';
import { calculateWaterfallDistribution, calculateEarlyRepayment } from './calculator';
import { getHookExecutionsFromTx, getInvestorRecoveredFromHook } from '@/lib/xrpl/hooks';

/**
 * Process charterer payment through hook (SINGLE TRANSACTION!)
 *
 * The hook automatically distributes the payment:
 * - Investor gets paid first (up to recovery target)
 * - Shipowner gets remainder (if any)
 */
export async function processChartererPaymentWithHook(
  agreement: FinancingAgreement,
  paymentAmount: number
): Promise<{
  agreement: FinancingAgreement;
  transactions: WaterfallTransaction[];
  hookExecuted: boolean;
}> {
  console.log(`💰 Processing charterer payment via HOOK: ${paymentAmount} XRP`);

  const transactions: WaterfallTransaction[] = [];

  try {
    // Calculate expected distribution (for UI preview)
    const distribution = calculateWaterfallDistribution(
      paymentAmount,
      agreement.investorRecovery
    );

    console.log('💡 Expected waterfall distribution:', {
      toInvestor: distribution.toInvestor,
      toShipowner: distribution.toShipowner,
      investorFullyPaid: distribution.investorFullyPaid,
    });

    // SINGLE TRANSACTION: Charterer → Platform (with hook)
    console.log('🎯 Step 1 (ONLY): Charterer → Platform Hook');
    const chartererTx = await sendXRP(
      agreement.wallets.charterer,
      agreement.wallets.platform.address,
      paymentAmount,
      'charterer_payment',
      `Voyage payment via Hook: ${paymentAmount} XRP`
    );
    transactions.push(chartererTx);

    // The HOOK automatically executes and distributes!
    console.log('⚡ HOOK EXECUTING: Automatic waterfall distribution...');

    // Wait a moment for hook execution
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check hook execution status
    let hookExecuted = false;
    if (chartererTx.hash) {
      const hookExecs = await getHookExecutionsFromTx(chartererTx.hash);
      console.log('🔍 Hook executions found:', hookExecs.length);
      hookExecuted = hookExecs.length > 0;

      if (hookExecuted) {
        console.log('✅ HOOK EXECUTED SUCCESSFULLY!');
        console.log('   Hook automatically distributed:');
        console.log(`   → Investor: ${distribution.toInvestor} XRP`);
        console.log(`   → Shipowner: ${distribution.toShipowner} XRP`);
      }
    }

    // Update investor recovery based on distribution
    const newRecovery = {
      ...agreement.investorRecovery,
      recovered: distribution.investorRecoveryAfter,
      remaining: agreement.investorRecovery.totalTarget - distribution.investorRecoveryAfter,
      percentageRecovered: (distribution.investorRecoveryAfter / agreement.investorRecovery.totalTarget) * 100,
      isFullyRecovered: distribution.investorFullyPaid,
      recoveredAt: distribution.investorFullyPaid ? new Date().toISOString() : undefined,
    };

    // Update agreement status
    let newStatus: FinancingStatus = agreement.status;
    if (distribution.investorFullyPaid && agreement.status === 'active') {
      newStatus = 'investor_recovered';
      console.log('🎉 Investor fully recovered!');
    }

    // Create synthetic transactions for UI (representing hook's automatic payments)
    if (distribution.toInvestor > 0) {
      transactions.push({
        id: `hook-investor-${Date.now()}`,
        type: 'investor_recovery',
        timestamp: new Date().toISOString(),
        from: agreement.wallets.platform.address,
        to: agreement.wallets.investor.address,
        amount: (distribution.toInvestor * 1_000_000).toString(),
        amountXRP: distribution.toInvestor,
        status: 'confirmed',
        notes: `Hook auto-payment: Investor recovery`,
        investorPortion: distribution.toInvestor.toString(),
      });
    }

    if (distribution.toShipowner > 0) {
      transactions.push({
        id: `hook-shipowner-${Date.now()}`,
        type: 'shipowner_payment',
        timestamp: new Date().toISOString(),
        from: agreement.wallets.platform.address,
        to: agreement.wallets.shipowner.address,
        amount: (distribution.toShipowner * 1_000_000).toString(),
        amountXRP: distribution.toShipowner,
        status: 'confirmed',
        notes: `Hook auto-payment: Shipowner remainder`,
        shipownerPortion: distribution.toShipowner.toString(),
      });
    }

    const updatedAgreement: FinancingAgreement = {
      ...agreement,
      investorRecovery: newRecovery,
      status: newStatus,
      transactions: [...agreement.transactions, ...transactions],
      updatedAt: new Date().toISOString(),
    };

    return {
      agreement: updatedAgreement,
      transactions,
      hookExecuted,
    };
  } catch (error) {
    console.error('❌ Hook-based payment failed:', error);
    throw error;
  }
}

/**
 * Verify hook execution and sync state from blockchain
 */
export async function verifyHookExecution(
  agreement: FinancingAgreement,
  txHash: string
): Promise<{
  executed: boolean;
  investorPaid: number;
  shipownerPaid: number;
}> {
  try {
    // Get hook executions from transaction
    const hookExecs = await getHookExecutionsFromTx(txHash);

    if (hookExecs.length === 0) {
      return {
        executed: false,
        investorPaid: 0,
        shipownerPaid: 0,
      };
    }

    // Parse hook execution results
    // This would extract amounts from hook metadata
    console.log('✅ Hook execution verified on blockchain');

    // Get updated investor recovered amount from hook state
    const recoveredFromHook = await getInvestorRecoveredFromHook(
      agreement.wallets.platform.address
    );

    console.log(`📊 Hook state: Investor recovered ${recoveredFromHook} XRP`);

    return {
      executed: true,
      investorPaid: 0, // Would parse from hook execution
      shipownerPaid: 0, // Would parse from hook execution
    };
  } catch (error) {
    console.error('Failed to verify hook execution:', error);
    return {
      executed: false,
      investorPaid: 0,
      shipownerPaid: 0,
    };
  }
}

/**
 * Process early repayment (still uses direct transactions, not hook)
 */
export async function processEarlyRepaymentWithHook(
  agreement: FinancingAgreement
): Promise<{
  agreement: FinancingAgreement;
  transactions: WaterfallTransaction[];
}> {
  console.log('💰 Processing early repayment from shipowner');

  const transactions: WaterfallTransaction[] = [];

  try {
    // Calculate early repayment amount
    const repaymentCalc = calculateEarlyRepayment(
      agreement.investorRecovery,
      agreement.earlyRepaymentPenaltyRate
    );

    console.log('💡 Early repayment calculation:', {
      debt: repaymentCalc.remainingDebt,
      penalty: repaymentCalc.penaltyAmount,
      total: repaymentCalc.totalDue,
    });

    // Step 1: Shipowner pays investor (debt)
    console.log('Step 1: Shipowner → Investor (debt repayment)');
    const debtTx = await sendXRP(
      agreement.wallets.shipowner,
      agreement.wallets.investor.address,
      repaymentCalc.toInvestor,
      'early_repayment',
      `Early debt repayment: ${repaymentCalc.toInvestor} XRP`
    );
    transactions.push(debtTx);

    // Step 2: Shipowner pays platform (penalty)
    console.log('Step 2: Shipowner → Platform (penalty fee)');
    const penaltyTx = await sendXRP(
      agreement.wallets.shipowner,
      agreement.wallets.platform.address,
      repaymentCalc.toPlatform,
      'penalty_fee',
      `Early repayment penalty: ${repaymentCalc.toPlatform} XRP`
    );
    penaltyTx.penaltyAmount = repaymentCalc.penaltyAmount.toString();
    transactions.push(penaltyTx);

    // Update investor recovery to fully paid
    const newRecovery = {
      ...agreement.investorRecovery,
      recovered: agreement.investorRecovery.totalTarget,
      remaining: 0,
      percentageRecovered: 100,
      isFullyRecovered: true,
      recoveredAt: new Date().toISOString(),
    };

    const updatedAgreement: FinancingAgreement = {
      ...agreement,
      investorRecovery: newRecovery,
      status: 'completed',
      transactions: [...agreement.transactions, ...transactions],
      updatedAt: new Date().toISOString(),
    };

    console.log('🎉 Early repayment completed! Investor fully paid.');

    return {
      agreement: updatedAgreement,
      transactions,
    };
  } catch (error) {
    console.error('❌ Early repayment failed:', error);
    throw error;
  }
}

/**
 * Refresh all wallet balances
 */
export async function refreshWalletBalancesWithHook(
  agreement: FinancingAgreement
): Promise<FinancingAgreement> {
  console.log('🔄 Refreshing wallet balances...');

  const [charterer, investor, shipowner, platform] = await Promise.all([
    updateWalletBalance(agreement.wallets.charterer),
    updateWalletBalance(agreement.wallets.investor),
    updateWalletBalance(agreement.wallets.shipowner),
    updateWalletBalance(agreement.wallets.platform),
  ]);

  // Also sync investor recovered amount from hook state
  try {
    const recoveredFromHook = await getInvestorRecoveredFromHook(platform.address);
    console.log(`📊 Synced from hook: ${recoveredFromHook} XRP recovered`);
  } catch (error) {
    console.log('⚠️  Could not sync hook state (hook may not be deployed)');
  }

  return {
    ...agreement,
    wallets: {
      charterer,
      investor,
      shipowner,
      platform,
    },
    updatedAt: new Date().toISOString(),
  };
}
