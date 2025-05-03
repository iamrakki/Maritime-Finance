/**
 * Waterfall Payment Distribution Calculator
 *
 * Implements the waterfall logic:
 * 1. Investor gets paid first (principal + interest)
 * 2. Once investor is fully recovered, shipowner gets remainder
 */

import {
  WaterfallDistribution,
  InvestorRecovery,
  EarlyRepaymentCalculation,
} from '@/types/waterfall';

/**
 * Calculate investor recovery status
 */
export function calculateInvestorRecovery(
  principal: number,
  interestRate: number,
  recovered: number
): InvestorRecovery {
  const interestAmount = (principal * interestRate) / 100;
  const totalTarget = principal + interestAmount;
  const remaining = Math.max(0, totalTarget - recovered);
  const percentageRecovered = totalTarget > 0 ? (recovered / totalTarget) * 100 : 0;
  const isFullyRecovered = recovered >= totalTarget;

  return {
    principal,
    interestRate,
    interestAmount,
    totalTarget,
    recovered,
    remaining,
    percentageRecovered: Math.min(100, percentageRecovered),
    isFullyRecovered,
    recoveredAt: isFullyRecovered ? new Date().toISOString() : undefined,
  };
}

/**
 * Calculate waterfall distribution for a payment
 */
export function calculateWaterfallDistribution(
  paymentAmount: number,
  investorRecovery: InvestorRecovery,
  platformFeeRate: number = 0 // Platform fee as percentage (e.g., 1 for 1%)
): WaterfallDistribution {
  const calculation: { step: string; amount: number; recipient: any }[] = [];
  let remaining = paymentAmount;

  // Calculate platform fee (if any)
  const platformFee = (paymentAmount * platformFeeRate) / 100;
  remaining -= platformFee;

  if (platformFee > 0) {
    calculation.push({
      step: `Platform fee (${platformFeeRate}%)`,
      amount: platformFee,
      recipient: 'platform',
    });
  }

  // Determine investor and shipowner portions
  let toInvestor = 0;
  let toShipowner = 0;

  if (!investorRecovery.isFullyRecovered) {
    // Investor not fully paid - prioritize investor
    const investorNeeds = investorRecovery.remaining;

    if (remaining >= investorNeeds) {
      // Payment covers investor fully, remainder goes to shipowner
      toInvestor = investorNeeds;
      toShipowner = remaining - investorNeeds;

      calculation.push({
        step: 'Investor full recovery (principal + interest)',
        amount: toInvestor,
        recipient: 'investor',
      });

      calculation.push({
        step: 'Remaining to shipowner',
        amount: toShipowner,
        recipient: 'shipowner',
      });
    } else {
      // Payment doesn't cover investor fully - all goes to investor
      toInvestor = remaining;
      toShipowner = 0;

      calculation.push({
        step: 'Partial investor recovery',
        amount: toInvestor,
        recipient: 'investor',
      });
    }
  } else {
    // Investor fully recovered - all goes to shipowner
    toShipowner = remaining;

    calculation.push({
      step: 'Investor already recovered - all to shipowner',
      amount: toShipowner,
      recipient: 'shipowner',
    });
  }

  // Calculate new investor recovery status
  const investorRecoveryBefore = investorRecovery.recovered;
  const investorRecoveryAfter = investorRecoveryBefore + toInvestor;
  const investorFullyPaid = investorRecoveryAfter >= investorRecovery.totalTarget;

  return {
    totalAmount: paymentAmount,
    toInvestor,
    toShipowner,
    platformFee,
    investorRecoveryBefore,
    investorRecoveryAfter,
    investorFullyPaid,
    calculation,
  };
}

/**
 * Calculate early repayment amount with penalty
 */
export function calculateEarlyRepayment(
  investorRecovery: InvestorRecovery,
  penaltyRate: number // Penalty as percentage (e.g., 2 for 2%)
): EarlyRepaymentCalculation {
  const remainingDebt = investorRecovery.remaining;
  const penaltyAmount = (remainingDebt * penaltyRate) / 100;
  const totalDue = remainingDebt + penaltyAmount;

  return {
    remainingDebt,
    penaltyRate,
    penaltyAmount,
    totalDue,
    toInvestor: remainingDebt,
    toPlatform: penaltyAmount,
  };
}

/**
 * Calculate total voyage revenue needed to cover loan
 */
export function calculateMinimumVoyageRevenue(
  principal: number,
  interestRate: number,
  platformFeeRate: number = 0
): number {
  const interestAmount = (principal * interestRate) / 100;
  const totalInvestorRecovery = principal + interestAmount;

  // Account for platform fee
  if (platformFeeRate > 0) {
    // If platform takes X%, then revenue needs to be: totalInvestorRecovery / (1 - X/100)
    return totalInvestorRecovery / (1 - platformFeeRate / 100);
  }

  return totalInvestorRecovery;
}

/**
 * Validate financing terms
 */
export function validateFinancingTerms(
  principal: number,
  interestRate: number,
  expectedVoyageRevenue: number,
  earlyRepaymentPenaltyRate: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (principal <= 0) {
    errors.push('Principal must be greater than 0');
  }

  if (interestRate < 0 || interestRate > 100) {
    errors.push('Interest rate must be between 0 and 100%');
  }

  if (expectedVoyageRevenue <= 0) {
    errors.push('Expected voyage revenue must be greater than 0');
  }

  if (earlyRepaymentPenaltyRate < 0 || earlyRepaymentPenaltyRate > 50) {
    errors.push('Early repayment penalty must be between 0 and 50%');
  }

  // Check if voyage revenue is sufficient
  const minimumRevenue = calculateMinimumVoyageRevenue(principal, interestRate);
  if (expectedVoyageRevenue < minimumRevenue) {
    errors.push(
      `Expected voyage revenue (${expectedVoyageRevenue} XRP) is less than minimum required (${minimumRevenue.toFixed(2)} XRP) to cover principal + interest`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format XRP amount for display
 */
export function formatXRP(amount: number, decimals: number = 2): string {
  return `${amount.toFixed(decimals)} XRP`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
