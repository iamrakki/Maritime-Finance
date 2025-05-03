/**
 * XRPL Transaction Management
 *
 * Functions for creating, submitting, and monitoring XRPL transactions
 */

import { Wallet, Payment, TxResponse } from 'xrpl';
import { WaterfallTransaction, TransactionType, WalletConfig } from '@/types/waterfall';
import { getXRPLClient } from './client';
import { xrpToDrops, dropsToXRP } from './wallets';

/**
 * Create a payment transaction
 */
export async function createPayment(
  fromWallet: WalletConfig,
  toAddress: string,
  amountXRP: number,
  memo?: string
): Promise<Payment> {
  const client = await getXRPLClient();

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: fromWallet.address,
    Destination: toAddress,
    Amount: xrpToDrops(amountXRP),
  };

  // Add memo if provided
  if (memo) {
    payment.Memos = [
      {
        Memo: {
          MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase(),
          MemoType: Buffer.from('waterfall-finance', 'utf8').toString('hex').toUpperCase(),
        },
      },
    ];
  }

  return payment;
}

/**
 * Submit and wait for transaction
 */
export async function submitTransaction(
  wallet: WalletConfig,
  payment: Payment
): Promise<TxResponse> {
  const client = await getXRPLClient();
  const xrplWallet = Wallet.fromSeed(wallet.secretKey);

  console.log('📤 Submitting transaction:', {
    from: wallet.address,
    to: payment.Destination,
    amount: dropsToXRP(payment.Amount as string),
  });

  // Use much higher fee for Xahau testnet to avoid telINSUF_FEE_P errors
  // Network is congested, need higher fee priority and longer validation window
  const response = await client.submitAndWait(payment, {
    wallet: xrplWallet,
    autofill: {
      maxLedgerVersionOffset: 20, // Allow 20 ledgers (~1 minute) for validation instead of default 3
    },
    fee: '1000', // Significantly increased fee (0.001 XRP) to ensure fast validation
  } as any); // Xahau Testnet - submitAndWait will use api_version: 1 from requests

  console.log('✅ Transaction confirmed:', response.result.hash);
  return response;
}

/**
 * Send XRP payment
 */
export async function sendXRP(
  fromWallet: WalletConfig,
  toAddress: string,
  amountXRP: number,
  transactionType: TransactionType,
  memo?: string
): Promise<WaterfallTransaction> {
  const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const transaction: WaterfallTransaction = {
    id: transactionId,
    type: transactionType,
    timestamp: new Date().toISOString(),
    from: fromWallet.address,
    to: toAddress,
    amount: xrpToDrops(amountXRP),
    amountXRP,
    status: 'pending',
    notes: memo,
  };

  try {
    // Create payment
    const payment = await createPayment(fromWallet, toAddress, amountXRP, memo);

    // Update status
    transaction.status = 'submitted';

    // Submit transaction
    const response = await submitTransaction(fromWallet, payment);

    // Update with response data
    transaction.status = 'confirmed';
    transaction.hash = response.result.hash;
    if (response.result.ledger_index) {
      transaction.ledgerIndex = response.result.ledger_index;
    }

    return transaction;
  } catch (error: any) {
    console.error('Transaction failed:', error);
    transaction.status = 'failed';
    transaction.errorMessage = error.message || 'Transaction failed';
    throw error;
  }
}

/**
 * Execute waterfall distribution (investor first, then shipowner)
 */
export async function executeWaterfallDistribution(
  platformWallet: WalletConfig,
  investorAddress: string,
  shipownerAddress: string,
  investorAmount: number,
  shipownerAmount: number
): Promise<{
  investorTx?: WaterfallTransaction;
  shipownerTx?: WaterfallTransaction;
}> {
  const result: {
    investorTx?: WaterfallTransaction;
    shipownerTx?: WaterfallTransaction;
  } = {};

  // Pay investor first (if amount > 0)
  if (investorAmount > 0) {
    console.log(`💰 Paying investor: ${investorAmount} XRP`);
    result.investorTx = await sendXRP(
      platformWallet,
      investorAddress,
      investorAmount,
      'investor_recovery',
      `Investor recovery payment: ${investorAmount} XRP`
    );
  }

  // Pay shipowner remainder (if amount > 0)
  if (shipownerAmount > 0) {
    console.log(`💰 Paying shipowner: ${shipownerAmount} XRP`);
    result.shipownerTx = await sendXRP(
      platformWallet,
      shipownerAddress,
      shipownerAmount,
      'shipowner_payment',
      `Shipowner payment: ${shipownerAmount} XRP`
    );
  }

  return result;
}

/**
 * Get transaction details by hash
 */
export async function getTransaction(txHash: string): Promise<any> {
  const client = await getXRPLClient();

  const response = await client.request({
    command: 'tx',
    transaction: txHash,
    api_version: 1, // Xahau uses API version 1
  });

  return response.result;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  maxAttempts: number = 10
): Promise<boolean> {
  const client = await getXRPLClient();

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await client.request({
        command: 'tx',
        transaction: txHash,
        api_version: 1, // Xahau uses API version 1
      });

      if (response.result.validated) {
        return true;
      }
    } catch (error) {
      // Transaction not found yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

/**
 * Get account transaction history
 */
export async function getAccountTransactions(
  address: string,
  limit: number = 20
): Promise<any[]> {
  const client = await getXRPLClient();

  try {
    const response = await client.request({
      command: 'account_tx',
      account: address,
      limit,
      api_version: 1, // Xahau uses API version 1
    });

    return response.result.transactions || [];
  } catch (error) {
    console.error(`Failed to get transactions for ${address}:`, error);
    return [];
  }
}
