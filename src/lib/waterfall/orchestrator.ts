/**
 * Waterfall Payment Orchestrator
 *
 * Coordinates complex multi-step payment flows for waterfall distribution
 */

import {
  FinancingAgreement,
  WaterfallTransaction,
  TransactionType,
  FinancingStatus,
} from '@/types/waterfall';
import { sendXRP, executeWaterfallDistribution } from '@/lib/xrpl/transactions';
import { updateWalletBalance } from '@/lib/xrpl/wallets';
import { calculateWaterfallDistribution, calculateEarlyRepayment } from './calculator';

/**
 * Process charterer payment through waterfall
 */
export async function processChartererPayment(
  agreement: FinancingAgreement,
  paymentAmount: number
): Promise<{
  agreement: FinancingAgreement;
  transactions: WaterfallTransaction[];
}> {
  console.log(`💰 Processing charterer payment: ${paymentAmount} XRP`);

  const transactions: WaterfallTransaction[] = [];

  try {
    // Step 1: Charterer pays platform
    console.log('Step 1: Charterer → Platform');
    const chartererTx = await sendXRP(
      agreement.wallets.charterer,
      agreement.wallets.platform.address,
      paymentAmount,
      'charterer_payment',
      `Voyage payment: ${paymentAmount} XRP`
    );
    transactions.push(chartererTx);

    // Step 2: Calculate waterfall distribution
    const distribution = calculateWaterfallDistribution(
      paymentAmount,
      agreement.investorRecovery
    );

    console.log('💡 Waterfall distribution:', {
      toInvestor: distribution.toInvestor,
      toShipowner: distribution.toShipowner,
      investorFullyPaid: distribution.investorFullyPaid,
    });

    // Step 3: Execute waterfall distribution from platform
    console.log('Step 2: Platform → Waterfall distribution');
    const distributionResult = await executeWaterfallDistribution(
      agreement.wallets.platform,
      agreement.wallets.investor.address,
      agreement.wallets.shipowner.address,
      distribution.toInvestor,
      distribution.toShipowner
    );

    // Add distribution transactions
    if (distributionResult.investorTx) {
      distributionResult.investorTx.investorPortion = distribution.toInvestor.toString();
      transactions.push(distributionResult.investorTx);
    }

    if (distributionResult.shipownerTx) {
      distributionResult.shipownerTx.shipownerPortion = distribution.toShipowner.toString();
      transactions.push(distributionResult.shipownerTx);
    }

    // Step 4: Update investor recovery
    const newRecovery = {
      ...agreement.investorRecovery,
      recovered: distribution.investorRecoveryAfter,
      remaining: agreement.investorRecovery.totalTarget - distribution.investorRecoveryAfter,
      percentageRecovered: (distribution.investorRecoveryAfter / agreement.investorRecovery.totalTarget) * 100,
      isFullyRecovered: distribution.investorFullyPaid,
      recoveredAt: distribution.investorFullyPaid ? new Date().toISOString() : undefined,
    };

    // Step 5: Update agreement status
    let newStatus: FinancingStatus = agreement.status;
    if (distribution.investorFullyPaid && agreement.status === 'active') {
      newStatus = 'investor_recovered';
      console.log('🎉 Investor fully recovered!');
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
    };
  } catch (error) {
    console.error('❌ Charterer payment failed:', error);
    throw error;
  }
}

/**
 * Process early repayment from shipowner
 */
export async function processEarlyRepayment(
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

    // Step 3: Update investor recovery to fully paid
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
 * Process shipowner default coverage
 * (Shipowner covers charterer's obligation)
 */
export async function processDefaultCoverage(
  agreement: FinancingAgreement,
  coverageAmount: number
): Promise<{
  agreement: FinancingAgreement;
  transactions: WaterfallTransaction[];
}> {
  console.log(`💰 Processing default coverage by shipowner: ${coverageAmount} XRP`);

  const transactions: WaterfallTransaction[] = [];

  try {
    // Shipowner pays directly to investor
    const coverageTx = await sendXRP(
      agreement.wallets.shipowner,
      agreement.wallets.investor.address,
      coverageAmount,
      'default_coverage',
      `Charterer default coverage: ${coverageAmount} XRP`
    );
    transactions.push(coverageTx);

    // Update investor recovery
    const newRecovered = agreement.investorRecovery.recovered + coverageAmount;
    const isFullyRecovered = newRecovered >= agreement.investorRecovery.totalTarget;

    const newRecovery = {
      ...agreement.investorRecovery,
      recovered: newRecovered,
      remaining: Math.max(0, agreement.investorRecovery.totalTarget - newRecovered),
      percentageRecovered: Math.min(100, (newRecovered / agreement.investorRecovery.totalTarget) * 100),
      isFullyRecovered,
      recoveredAt: isFullyRecovered ? new Date().toISOString() : undefined,
    };

    let newStatus: FinancingStatus = 'defaulted';
    if (isFullyRecovered) {
      newStatus = 'completed';
      console.log('🎉 Investor fully recovered after default coverage!');
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
    };
  } catch (error) {
    console.error('❌ Default coverage failed:', error);
    throw error;
  }
}

/**
 * Refresh all wallet balances
 */
export async function refreshWalletBalances(
  agreement: FinancingAgreement
): Promise<FinancingAgreement> {
  console.log('🔄 Refreshing wallet balances...');

  const [charterer, investor, shipowner, platform] = await Promise.all([
    updateWalletBalance(agreement.wallets.charterer),
    updateWalletBalance(agreement.wallets.investor),
    updateWalletBalance(agreement.wallets.shipowner),
    updateWalletBalance(agreement.wallets.platform),
  ]);

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
