'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Ship,
  Wallet,
  Settings,
  Play,
  ArrowRight,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  DollarSign,
  Building2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { FinancingAgreement, WalletConfig } from '@/types/waterfall';
import { createWalletFromSeed, updateAllWalletBalances, generateAllWallets, fundAllWallets } from '@/lib/xrpl/wallets';
import { getXRPLClient, disconnectXRPL } from '@/lib/xrpl/client';
import { calculateInvestorRecovery, calculateWaterfallDistribution, calculateEarlyRepayment } from '@/lib/waterfall/calculator';
import { processChartererPaymentWithHook, processEarlyRepaymentWithHook, refreshWalletBalancesWithHook } from '@/lib/waterfall/hookOrchestrator';
import { deployWaterfallHook } from '@/lib/xrpl/hooks';
import WaterfallFlowDiagram from '@/components/simulator/WaterfallFlowDiagram';
import InvestorRecoveryTracker from '@/components/simulator/InvestorRecoveryTracker';
import TransactionTimeline from '@/components/simulator/TransactionTimeline';
import WalletBalanceCards from '@/components/simulator/WalletBalanceCards';

export default function SimulatorPage() {
  // Setup State
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [setupStep, setSetupStep] = useState<'wallets' | 'terms' | 'ready'>('wallets');
  const [isGenerating, setIsGenerating] = useState(false);

  // Wallet Secrets - Hardcoded from realWallets.ts (All Ed25519)
  const [chartererSecret, setChartererSecret] = useState('sEdTYETVj89Vt8415esLEvqhRyXw516');
  const [investorSecret, setInvestorSecret] = useState('sEd7ZguPnUhwWXMzJJVTGfbMQ2Yjauc');
  const [shipownerSecret, setShipownerSecret] = useState('sEd7YwJTAUCyrQiaNcGpVUhukrPZM38');
  const [platformSecret, setPlatformSecret] = useState('sEdTk3FMu1ojhchiss2KXY8Uw71DMce');
  const [generatedWallets, setGeneratedWallets] = useState<{
    charterer: WalletConfig;
    investor: WalletConfig;
    shipowner: WalletConfig;
    platform: WalletConfig;
  } | null>(null);

  // Financing Terms
  const [principal, setPrincipal] = useState(1000);
  const [interestRate, setInterestRate] = useState(5);
  const [voyageRevenue, setVoyageRevenue] = useState(1500);
  const [penaltyRate, setPenaltyRate] = useState(2);

  // Agreement State
  const [agreement, setAgreement] = useState<FinancingAgreement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [lastDistribution, setLastDistribution] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Custom payment amounts
  const [customPaymentAmount, setCustomPaymentAmount] = useState(500);

  // Connect to XRPL on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await getXRPLClient();
      } catch (err) {
        console.error('Failed to connect to XRPL:', err);
      }
    };
    connect();

    return () => {
      disconnectXRPL();
    };
  }, []);

  // Auto-generate and fund wallets
  const handleAutoGenerateWallets = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎲 Generating 4 new wallets...');

      // Generate wallets
      const wallets = generateAllWallets();
      setGeneratedWallets(wallets);

      // Set secrets in form
      setChartererSecret(wallets.charterer.secretKey);
      setInvestorSecret(wallets.investor.secretKey);
      setShipownerSecret(wallets.shipowner.secretKey);
      setPlatformSecret(wallets.platform.secretKey);

      console.log('✅ Wallets generated!');
      console.log('💸 Starting funding process...');

      // Fund all wallets
      await fundAllWallets(wallets);

      console.log('✅ All wallets funded! Ready to proceed.');
    } catch (err: any) {
      console.error('Failed to generate/fund wallets:', err);
      setError(err.message || 'Failed to generate wallets');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize Agreement
  const handleInitializeAgreement = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔄 Creating wallets from secret keys...');
      // Create wallets from seeds
      const charterer = createWalletFromSeed(chartererSecret, 'charterer');
      const investor = createWalletFromSeed(investorSecret, 'investor');
      const shipowner = createWalletFromSeed(shipownerSecret, 'shipowner');
      const platform = createWalletFromSeed(platformSecret, 'platform');

      console.log('💰 Fetching wallet balances from blockchain...');
      // Update balances
      const walletsWithBalances = await updateAllWalletBalances({
        charterer,
        investor,
        shipowner,
        platform,
      });

      console.log('📊 Calculating investor recovery targets...');
      // Calculate investor recovery
      const investorRecovery = calculateInvestorRecovery(principal, interestRate, 0);

      console.log('🚀 Deploying waterfall hook to platform wallet...');
      // Deploy waterfall hook to platform wallet
      const hookResult = await deployWaterfallHook(
        walletsWithBalances.platform,
        walletsWithBalances.investor.address,
        walletsWithBalances.shipowner.address,
        principal + (principal * interestRate) / 100
      );

      console.log('Hook deployment result:', hookResult);

      // Create agreement
      const newAgreement: FinancingAgreement = {
        id: `agreement-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        principal,
        interestRate,
        expectedVoyageRevenue: voyageRevenue,
        earlyRepaymentPenaltyRate: penaltyRate,
        wallets: walletsWithBalances,
        hook: {
          status: hookResult.success ? 'active' : 'error',
          address: walletsWithBalances.platform.address,
          createdAt: new Date().toISOString(),
          errorMessage: hookResult.error,
        },
        investorRecovery,
        status: 'active',
        transactions: [],
      };

      setAgreement(newAgreement);
      setIsConfigured(true);
      setSetupStep('ready');

      if (hookResult.success) {
        console.log('✅ Waterfall hook deployed successfully!');
      } else {
        console.warn('⚠️ Hook deployment failed, will use fallback mode');
        console.warn('   Error:', hookResult.error);
      }
    } catch (err: any) {
      console.error('❌ Agreement initialization error:', err);
      const errorMessage = err.message || 'Failed to initialize agreement';

      // Provide helpful error messages for common issues
      if (errorMessage.includes('actNotFound') || errorMessage.includes('unfunded')) {
        setError('One or more wallets are not funded. Please fund all wallets with at least 100 XRP from the Hooks Testnet V3 faucet.');
      } else if (errorMessage.includes('connect') || errorMessage.includes('network')) {
        setError('Cannot connect to XRPL Hooks Testnet. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Refresh Wallet Balances
  const handleRefreshBalances = async () => {
    if (!agreement) return;

    setIsRefreshing(true);
    try {
      const updated = await refreshWalletBalancesWithHook(agreement);
      setAgreement(updated);
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process Charterer Payment (with Hook!)
  const handleChartererPayment = async (amount: number) => {
    if (!agreement) return;

    setIsProcessing(true);
    setProcessingMessage('Processing payment via XRPL Hook...');
    setIsAnimating(true);
    setError(null);

    try {
      // Calculate distribution preview
      const distribution = calculateWaterfallDistribution(amount, agreement.investorRecovery);
      setLastDistribution(distribution);

      // Process payment via HOOK (single transaction!)
      console.log('🎯 Initiating hook-based payment...');
      const result = await processChartererPaymentWithHook(agreement, amount);
      setAgreement(result.agreement);

      if (result.hookExecuted) {
        console.log('⚡ HOOK EXECUTED! Waterfall automatically distributed.');
        setProcessingMessage('Hook executed! Payments distributed automatically.');
      }

      // Refresh balances
      setTimeout(async () => {
        const updated = await refreshWalletBalancesWithHook(result.agreement);
        setAgreement(updated);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
      setTimeout(() => setIsAnimating(false), 3000);
    }
  };

  // Process Early Repayment
  const handleEarlyRepayment = async () => {
    if (!agreement) return;

    setIsProcessing(true);
    setProcessingMessage('Processing early repayment...');
    setError(null);

    try {
      const result = await processEarlyRepaymentWithHook(agreement);
      setAgreement(result.agreement);

      // Refresh balances
      setTimeout(async () => {
        const updated = await refreshWalletBalancesWithHook(result.agreement);
        setAgreement(updated);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Early repayment failed');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Auto-run demo after setup
  const handleAutoRunDemo = async () => {
    if (!agreement) return;

    console.log('🎬 Starting auto-run demo...');

    // Wait a moment for UI to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Run payment 1: 500 XRP
    console.log('💰 Demo Payment 1: 500 XRP');
    await handleChartererPayment(500);

    // Wait for transaction to settle
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Run payment 2: 750 XRP (complete investor recovery)
    console.log('💰 Demo Payment 2: 750 XRP');
    await handleChartererPayment(750);

    console.log('✅ Auto-run demo completed!');
  };

  // Setup UI
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-maritime-dark flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                  <Shield className="w-5 h-5 text-rlusd-glow" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold text-text-primary">
                    Waterfall Finance Simulator
                  </h1>
                  <p className="text-xs text-text-muted">XRPL Testnet Integration</p>
                </div>
              </div>
              <Link href="/dashboard">
                <button className="px-4 py-2 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-rlusd-primary/30 transition-all">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Setup Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Steps Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`px-4 py-2 rounded-lg ${setupStep === 'wallets' ? 'bg-rlusd-primary/20 text-rlusd-glow' : 'bg-maritime-slate/30 text-text-muted'}`}>
                1. Wallet Setup
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted" />
              <div className={`px-4 py-2 rounded-lg ${setupStep === 'terms' ? 'bg-rlusd-primary/20 text-rlusd-glow' : 'bg-maritime-slate/30 text-text-muted'}`}>
                2. Financing Terms
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted" />
              <div className={`px-4 py-2 rounded-lg ${setupStep === 'ready' ? 'bg-rlusd-primary/20 text-rlusd-glow' : 'bg-maritime-slate/30 text-text-muted'}`}>
                3. Ready
              </div>
            </div>

            <AnimatePresence mode="wait">
              {setupStep === 'wallets' && (
                <motion.div
                  key="wallets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card p-8"
                >
                  <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                    Configure Wallets
                  </h2>
                  <p className="text-text-muted mb-2">
                    Wallet secrets are pre-filled from your configuration. You can modify them or generate new ones.
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 mb-6">
                    <CheckCircle2 className="w-4 h-4 text-rlusd-glow shrink-0" />
                    <p className="text-sm text-rlusd-glow">
                      Using wallets from realWallets.ts configuration
                    </p>
                  </div>

                  {/* Auto-Generate Button */}
                  <div className="mb-6">
                    <button
                      onClick={handleAutoGenerateWallets}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-accent-sky/20 to-accent-ocean/20 border border-accent-sky/30 text-accent-sky font-medium hover:shadow-glow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating & Funding Wallets...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          Auto-Generate & Fund 4 Wallets
                        </>
                      )}
                    </button>
                    <p className="text-xs text-text-muted text-center mt-2">
                      Automatically creates 4 testnet wallets and funds them from Xahau Testnet faucet
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-maritime-dark text-text-muted">OR ENTER MANUALLY</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Charterer */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Ship className="w-4 h-4 inline mr-2" />
                        Charterer Secret Key
                      </label>
                      <input
                        type="password"
                        value={chartererSecret}
                        onChange={(e) => setChartererSecret(e.target.value)}
                        placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary placeholder-text-muted focus:border-rlusd-primary/50 focus:outline-none font-mono text-sm"
                      />
                    </div>

                    {/* Investor */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Investor Secret Key
                      </label>
                      <input
                        type="password"
                        value={investorSecret}
                        onChange={(e) => setInvestorSecret(e.target.value)}
                        placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary placeholder-text-muted focus:border-rlusd-primary/50 focus:outline-none font-mono text-sm"
                      />
                    </div>

                    {/* Shipowner */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Shipowner Secret Key
                      </label>
                      <input
                        type="password"
                        value={shipownerSecret}
                        onChange={(e) => setShipownerSecret(e.target.value)}
                        placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary placeholder-text-muted focus:border-rlusd-primary/50 focus:outline-none font-mono text-sm"
                      />
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Platform Secret Key
                      </label>
                      <input
                        type="password"
                        value={platformSecret}
                        onChange={(e) => setPlatformSecret(e.target.value)}
                        placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary placeholder-text-muted focus:border-rlusd-primary/50 focus:outline-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Display generated wallet addresses */}
                  {generatedWallets && (
                    <div className="p-4 rounded-lg bg-accent-sky/10 border border-accent-sky/30 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-accent-sky" />
                        <h3 className="font-medium text-accent-sky">Generated Wallets</h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Charterer:</span>
                          <span className="font-mono text-text-primary">{generatedWallets.charterer.address.slice(0, 20)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Investor:</span>
                          <span className="font-mono text-text-primary">{generatedWallets.investor.address.slice(0, 20)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Shipowner:</span>
                          <span className="font-mono text-text-primary">{generatedWallets.shipowner.address.slice(0, 20)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Platform:</span>
                          <span className="font-mono text-text-primary">{generatedWallets.platform.address.slice(0, 20)}...</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mt-3">
                        Secret keys have been filled in the form above. Save them if needed!
                      </p>
                    </div>
                  )}

                  {/* Wallet Addresses Reference */}
                  <div className="p-4 rounded-lg bg-maritime-slate/30 border border-white/10 mb-6">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Pre-configured Wallet Addresses (All Ed25519)</h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Platform:</span>
                        <span className="text-text-primary">rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Investor:</span>
                        <span className="text-text-primary">rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Shipowner:</span>
                        <span className="text-text-primary">rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Charterer:</span>
                        <span className="text-text-primary">rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 mb-6">
                    <Shield className="w-5 h-5 text-rlusd-glow shrink-0" />
                    <div className="text-sm text-text-muted">
                      <strong className="text-rlusd-glow">Xahau Testnet:</strong> Using native hooks for trustless waterfall distribution. Get test wallets at{' '}
                      <a
                        href="https://xahau-test.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rlusd-glow hover:underline"
                      >
                        Xahau Faucet <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => setSetupStep('terms')}
                    disabled={!chartererSecret || !investorSecret || !shipownerSecret || !platformSecret}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Configure Terms
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {setupStep === 'terms' && (
                <motion.div
                  key="terms"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card p-8"
                >
                  <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                    Financing Terms
                  </h2>
                  <p className="text-text-muted mb-6">
                    Configure the loan and voyage parameters
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Principal */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Loan Principal (XRP)
                      </label>
                      <input
                        type="number"
                        value={principal}
                        onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary focus:border-rlusd-primary/50 focus:outline-none"
                      />
                      <p className="text-xs text-text-muted mt-1">Amount investor lends to shipowner</p>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary focus:border-rlusd-primary/50 focus:outline-none"
                      />
                      <p className="text-xs text-text-muted mt-1">Annual interest rate</p>
                    </div>

                    {/* Expected Voyage Revenue */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Expected Voyage Revenue (XRP)
                      </label>
                      <input
                        type="number"
                        value={voyageRevenue}
                        onChange={(e) => setVoyageRevenue(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary focus:border-rlusd-primary/50 focus:outline-none"
                      />
                      <p className="text-xs text-text-muted mt-1">Expected payment from charterer</p>
                    </div>

                    {/* Early Repayment Penalty */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Early Repayment Penalty (%)
                      </label>
                      <input
                        type="number"
                        value={penaltyRate}
                        onChange={(e) => setPenaltyRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary focus:border-rlusd-primary/50 focus:outline-none"
                      />
                      <p className="text-xs text-text-muted mt-1">Penalty for early loan payoff</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 mb-6">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Financing Summary</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-text-muted">Investor Target:</span>
                        <span className="ml-2 font-mono text-rlusd-glow font-bold">
                          {(principal + (principal * interestRate) / 100).toFixed(2)} XRP
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Shipowner Gets:</span>
                        <span className="ml-2 font-mono text-accent-amber font-bold">
                          {(voyageRevenue - principal - (principal * interestRate) / 100).toFixed(2)} XRP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSetupStep('wallets')}
                      className="px-6 py-4 rounded-xl bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-rlusd-primary/30 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleInitializeAgreement}
                      disabled={isConnecting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting to XRPL...
                        </>
                      ) : (
                        <>
                          Initialize Agreement
                          <Play className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 rounded-lg bg-accent-coral/10 border border-accent-coral/30">
                      <p className="text-sm text-accent-coral">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // Main Simulator UI
  return (
    <div className="min-h-screen bg-maritime-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                <Shield className="w-5 h-5 text-rlusd-glow" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-text-primary">
                  Waterfall Finance Simulator
                </h1>
                <p className="text-xs text-text-muted">
                  Agreement ID: {agreement?.id.slice(-8)} • Xahau Testnet
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Hook Status */}
              {agreement?.hook && (
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                  agreement.hook.status === 'active' ? 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30' :
                  'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                }`}>
                  <Shield className="w-3 h-3" />
                  {agreement.hook.status === 'active' ? 'Hook Active' : 'Hook Disabled'}
                </div>
              )}
              {agreement?.status && (
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  agreement.status === 'active' ? 'bg-accent-sky/20 text-accent-sky border border-accent-sky/30' :
                  agreement.status === 'investor_recovered' ? 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30' :
                  agreement.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-maritime-slate/30 text-text-muted border border-white/10'
                }`}>
                  {agreement.status === 'active' ? 'Active' :
                   agreement.status === 'investor_recovered' ? 'Investor Recovered' :
                   agreement.status === 'completed' ? 'Completed' : agreement.status}
                </div>
              )}
              <Link href="/dashboard">
                <button className="px-4 py-2 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-rlusd-primary/30 transition-all">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-accent-coral/10 border border-accent-coral/30 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-accent-coral shrink-0" />
              <p className="text-sm text-accent-coral">{error}</p>
            </motion.div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-rlusd-glow animate-spin shrink-0" />
              <p className="text-sm text-rlusd-glow">{processingMessage}</p>
            </motion.div>
          )}

          {/* Wallet Balances */}
          {agreement && (
            <WalletBalanceCards
              wallets={agreement.wallets}
              onRefresh={handleRefreshBalances}
              isRefreshing={isRefreshing}
            />
          )}

          {/* Main Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Investor Recovery */}
              {agreement && (
                <InvestorRecoveryTracker recovery={agreement.investorRecovery} />
              )}

              {/* Action Buttons */}
              <div className="card p-6">
                <h3 className="font-display text-lg font-semibold text-text-primary mb-4">
                  Simulator Actions
                </h3>

                {/* Auto-run Demo Button */}
                {generatedWallets && agreement && agreement.investorRecovery.percentageRecovered === 0 && (
                  <div className="mb-4">
                    <button
                      onClick={handleAutoRunDemo}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" />
                      Auto-Run Demo (2 Payments)
                    </button>
                    <p className="text-xs text-text-muted text-center mt-2">
                      Automatically demonstrates the waterfall with 500 XRP then 750 XRP payments
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Charterer Payment */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Charterer Payment Amount (XRP)
                    </label>
                    <input
                      type="number"
                      value={customPaymentAmount}
                      onChange={(e) => setCustomPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary focus:border-rlusd-primary/50 focus:outline-none mb-2"
                    />
                    <button
                      onClick={() => handleChartererPayment(customPaymentAmount)}
                      disabled={isProcessing || !agreement || customPaymentAmount <= 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent-sky/20 border border-accent-sky/30 text-accent-sky hover:bg-accent-sky/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Ship className="w-5 h-5" />
                      Charterer Pays {customPaymentAmount} XRP
                    </button>
                  </div>

                  {/* Quick Payment Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleChartererPayment(500)}
                      disabled={isProcessing || !agreement}
                      className="px-3 py-2 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-accent-sky/30 transition-all text-sm disabled:opacity-50"
                    >
                      500 XRP
                    </button>
                    <button
                      onClick={() => handleChartererPayment(750)}
                      disabled={isProcessing || !agreement}
                      className="px-3 py-2 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-accent-sky/30 transition-all text-sm disabled:opacity-50"
                    >
                      750 XRP
                    </button>
                    <button
                      onClick={() => handleChartererPayment(1000)}
                      disabled={isProcessing || !agreement}
                      className="px-3 py-2 rounded-lg bg-maritime-slate/30 border border-white/10 text-text-primary hover:border-accent-sky/30 transition-all text-sm disabled:opacity-50"
                    >
                      1000 XRP
                    </button>
                  </div>

                  {/* Early Repayment */}
                  {agreement && !agreement.investorRecovery.isFullyRecovered && (
                    <div className="pt-3 border-t border-white/5">
                      {(() => {
                        const calc = calculateEarlyRepayment(agreement.investorRecovery, agreement.earlyRepaymentPenaltyRate);
                        return (
                          <>
                            <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 mb-3">
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Remaining Debt:</span>
                                  <span className="font-mono text-text-primary">{calc.remainingDebt.toFixed(2)} XRP</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Penalty ({calc.penaltyRate}%):</span>
                                  <span className="font-mono text-accent-amber">{calc.penaltyAmount.toFixed(2)} XRP</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-2 border-t border-accent-amber/20">
                                  <span className="text-text-primary">Total Due:</span>
                                  <span className="font-mono text-accent-amber">{calc.totalDue.toFixed(2)} XRP</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={handleEarlyRepayment}
                              disabled={isProcessing}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent-amber/20 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/30 transition-all disabled:opacity-50"
                            >
                              <AlertTriangle className="w-5 h-5" />
                              Shipowner Early Repayment
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Waterfall Flow Diagram */}
              <div className="card p-6">
                <WaterfallFlowDiagram
                  distribution={lastDistribution}
                  isAnimating={isAnimating}
                />
              </div>

              {/* Transaction Timeline */}
              {agreement && agreement.transactions.length > 0 && (
                <TransactionTimeline transactions={agreement.transactions} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
