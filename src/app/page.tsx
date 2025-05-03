'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ship,
  Anchor,
  FileCheck,
  TrendingUp,
  Wallet,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Coins,
  Clock,
  Lock,
  AlertTriangle,
  Eye,
  Zap,
  Globe,
  ChevronRight,
  Waves,
  Loader2
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const sdk = (await import('@crossmarkio/sdk')).default;

      // Check if Crossmark is installed
      const isConnected = await sdk.async.connect();

      if (!isConnected) {
        alert('Crossmark is not installed. Please install the Crossmark browser extension.');
        setIsConnecting(false);
        return;
      }

      // Sign in to get wallet access
      await sdk.async.signInAndWait();

      // Get the wallet address from session
      const address = sdk.session.address;

      if (address) {
        setWalletAddress(address);
        // Store wallet address in localStorage for dashboard
        localStorage.setItem('walletAddress', address);

        // Route directly to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-maritime-deeper/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Ship className="w-5 h-5 text-rlusd-glow" />
                </motion.div>
              </div>
              <div>
                <span className="font-display text-lg font-semibold text-text-primary">Maritime Finance</span>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#for-who" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Who It's For
              </Link>
              <motion.button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white text-sm font-medium hover:shadow-glow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isConnecting ? 1 : 1.02 }}
                whileTap={{ scale: isConnecting ? 1 : 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-rlusd-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-sky/5 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rlusd-primary/10 border border-rlusd-primary/20 text-sm text-rlusd-glow">
                  <Zap className="w-4 h-4" />
                  Built on XRP Ledger
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6"
              >
                Turn Shipping Voyages into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rlusd-primary to-rlusd-glow">
                  Bankable Transactions
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-text-secondary mb-8 leading-relaxed"
              >
                Track real charter payments and vessel activity to build credit and unlock fast, short-term liquidity for shipowners.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex items-center gap-4">
                <Link href="/onboarding">
                  <motion.button
                    className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium text-lg hover:shadow-glow-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Onboarding
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="#how-it-works">
                  <motion.button
                    className="flex items-center gap-2 px-6 py-4 rounded-xl border border-white/10 text-text-primary font-medium hover:bg-maritime-slate/30 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    See How It Works
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rlusd-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-rlusd-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Verified Transactions</p>
                    <p className="text-xs text-text-muted">On-chain proof</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-sky/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent-sky" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Short-term Liquidity</p>
                    <p className="text-xs text-text-muted">Voyage-based</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                {/* Main card */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rlusd-primary/20 to-rlusd-primary/5 flex items-center justify-center">
                        <Ship className="w-6 h-6 text-rlusd-glow" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">MV Pacific Meridian</p>
                        <p className="text-xs text-text-muted">Singapore → Rotterdam</p>
                      </div>
                    </div>
                    <div className="status-badge status-active">
                      <span className="w-2 h-2 rounded-full bg-rlusd-glow animate-pulse" />
                      In Transit
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-muted">Voyage Progress</span>
                      <span className="text-sm font-mono text-rlusd-glow">42%</span>
                    </div>
                    <div className="h-2 bg-maritime-slate/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-rlusd-dim to-rlusd-primary"
                        initial={{ width: 0 }}
                        animate={{ width: '42%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-rlusd-primary/5 border border-rlusd-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-rlusd-glow" />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">Departure Confirmed</p>
                        <p className="text-xs text-text-muted">712,500 RLUSD released</p>
                      </div>
                      <span className="text-xs text-rlusd-glow font-mono">25%</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-maritime-slate/30 border border-white/5">
                      <div className="w-5 h-5 rounded-full border-2 border-accent-amber flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">Suez Canal Transit</p>
                        <p className="text-xs text-text-muted">Pending verification</p>
                      </div>
                      <span className="text-xs text-text-muted font-mono">25%</span>
                    </div>
                  </div>
                </div>

                {/* Floating stats */}
                <motion.div
                  className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-maritime-navy/90 backdrop-blur-sm border border-white/10 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <p className="text-xs text-text-muted mb-1">Charter Value</p>
                  <p className="text-2xl font-mono font-bold text-rlusd-glow">2,850,000</p>
                  <p className="text-xs text-text-muted">RLUSD</p>
                </motion.div>

                <motion.div
                  className="absolute -top-4 -right-4 p-4 rounded-xl bg-maritime-navy/90 backdrop-blur-sm border border-rlusd-primary/20 shadow-xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rlusd-glow" />
                    <span className="text-sm font-medium text-text-primary">Credit Score</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-rlusd-glow mt-1">847</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-text-muted">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-rlusd-primary"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-coral/10 border border-accent-coral/20 text-sm text-accent-coral mb-6">
              <AlertTriangle className="w-4 h-4" />
              The Problem
            </span>
            <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
              Maritime operations are cash-flow heavy,<br />but hard to finance.
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-accent-coral/10 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-accent-coral" />
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                High Upfront Costs
              </h3>
              <p className="text-sm text-text-muted">
                Shipowners bear significant operational costs—fuel, crew, port fees—before receiving any payment from charterers.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-accent-amber/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent-amber" />
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                Slow & Fragmented Payments
              </h3>
              <p className="text-sm text-text-muted">
                Charter payments are slow, fragmented across multiple parties, and lack transparency throughout the voyage lifecycle.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-accent-violet" />
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                Balance Sheet Focus
              </h3>
              <p className="text-sm text-text-muted">
                Traditional financing evaluates company balance sheets, not the real work done. Good operators with thin margins get overlooked.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 relative bg-gradient-to-b from-transparent via-rlusd-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rlusd-primary/10 border border-rlusd-primary/20 text-sm text-rlusd-glow mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Our Solution
            </span>
            <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
              We finance verified work, not promises.
            </h2>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
              Our platform tracks charter transactions, vessel movements, and payment milestones to create a verifiable transaction history. This data builds a credit profile that enables fast, short-term financing tied to each voyage.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-rlusd-primary/20 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-rlusd-glow" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary mb-1">Verified Transaction History</h3>
                  <p className="text-sm text-text-muted">Every charter payment and milestone is recorded on-chain, creating an immutable record of completed work.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-sky/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-accent-sky" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary mb-1">Dynamic Credit Building</h3>
                  <p className="text-sm text-text-muted">Your credit score grows with each successful voyage. Better history means better financing terms.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-violet/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-accent-violet" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary mb-1">Voyage-Based Liquidity</h3>
                  <p className="text-sm text-text-muted">Access working capital tied to specific voyages, not long-term debt that burdens your balance sheet.</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="text-center mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Credit Profile</p>
                <div className="relative inline-block">
                  <svg className="w-40 h-40" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      whileInView={{ strokeDashoffset: 283 * 0.15 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.3 }}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00a080" />
                        <stop offset="100%" stopColor="#00ffcc" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-mono font-bold text-rlusd-glow">847</p>
                      <p className="text-xs text-text-muted">Excellent</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-maritime-slate/30">
                  <span className="text-sm text-text-muted">Completed Voyages</span>
                  <span className="text-sm font-mono text-text-primary">24</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-maritime-slate/30">
                  <span className="text-sm text-text-muted">On-time Payment Rate</span>
                  <span className="text-sm font-mono text-rlusd-glow">98.5%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-maritime-slate/30">
                  <span className="text-sm text-text-muted">Total Transaction Volume</span>
                  <span className="text-sm font-mono text-text-primary">$42.8M</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-sky/10 border border-accent-sky/20 text-sm text-accent-sky mb-6">
              <Globe className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="font-display text-4xl font-bold text-text-primary">
              Three steps to liquidity
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileCheck,
                title: 'Transaction Recorded',
                description: 'Shipowners initiate charter transactions. Key milestones and documents are verified through trusted data sources.',
                color: 'rlusd-primary'
              },
              {
                step: '02',
                icon: TrendingUp,
                title: 'Credit Built',
                description: 'Every completed transaction strengthens the shipowner\'s on-chain credit history, unlocking better terms over time.',
                color: 'accent-sky'
              },
              {
                step: '03',
                icon: Coins,
                title: 'Liquidity Unlocked',
                description: 'Approved voyages can access short-term capital. Investors are repaid directly from charter payments.',
                color: 'accent-violet'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-white/10 to-transparent z-0" />
                )}
                <div className="card p-8 relative z-10 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl font-display font-bold text-white/5">{item.step}</span>
                    <div className={`w-14 h-14 rounded-xl bg-${item.color}/10 flex items-center justify-center`}>
                      <item.icon className={`w-7 h-7 text-${item.color}`} />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-24 relative bg-gradient-to-b from-transparent via-maritime-slate/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rlusd-primary/10 border border-rlusd-primary/20 text-sm text-rlusd-glow mb-6">
              <Shield className="w-4 h-4" />
              Trust & Control
            </span>
            <h2 className="font-display text-4xl font-bold text-text-primary">
              Designed for predictability, not speculation.
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Anchor,
                title: 'Voyage-Tied Loans',
                description: 'Each loan is tied to a specific voyage with clear milestones and repayment terms.'
              },
              {
                icon: CheckCircle2,
                title: 'Milestone Verification',
                description: 'Capital released only after verified milestones—departure, transit checkpoints, arrival.'
              },
              {
                icon: Lock,
                title: 'Clear Waterfall',
                description: 'Transparent responsibility and repayment structure. Everyone knows their position.'
              },
              {
                icon: Shield,
                title: 'Isolated Defaults',
                description: 'Defaults impact individual credit, not the entire system. Risk is contained.'
              }
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp} className="card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-rlusd-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-rlusd-glow" />
                </div>
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-text-muted">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="for-who" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-violet/10 border border-accent-violet/20 text-sm text-accent-violet mb-6">
              <Users className="w-4 h-4" />
              Who It's For
            </span>
            <h2 className="font-display text-4xl font-bold text-text-primary">
              Built for every stakeholder
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Ship,
                title: 'Shipowners',
                description: 'Access liquidity without long-term debt. Get working capital based on verified voyage activity, not just your balance sheet.',
                color: 'rlusd-primary',
                features: ['Working capital per voyage', 'Build on-chain credit', 'No long-term debt']
              },
              {
                icon: FileCheck,
                title: 'Charterers',
                description: 'Pay through a transparent, auditable process. Milestone-based escrow ensures you only pay for verified progress.',
                color: 'accent-sky',
                features: ['Transparent payments', 'Milestone verification', 'Escrow protection']
              },
              {
                icon: Coins,
                title: 'Investors',
                description: 'Earn yield from short-duration, transaction-backed financing. Clear risk profiles tied to individual voyages.',
                color: 'accent-violet',
                features: ['Short-term yield', 'Transaction-backed', 'Diversified exposure']
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="card p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className={`w-14 h-14 rounded-xl bg-${item.color}/10 flex items-center justify-center mb-6`}>
                  <item.icon className={`w-7 h-7 text-${item.color}`} />
                </div>
                <h3 className="font-display text-2xl font-semibold text-text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary mb-6">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-text-muted">
                      <CheckCircle2 className={`w-4 h-4 text-${item.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Credibility */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center md:text-left">
              <p className="text-sm text-text-muted mb-2">Powered by</p>
              <h3 className="font-display text-2xl font-semibold text-text-primary">
                XRP Ledger
              </h3>
              <p className="text-sm text-text-secondary mt-2 max-w-md">
                Built on the XRP Ledger with RLUSD stablecoin, escrow logic, and decentralized identity primitives.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-rlusd-primary/10 border border-rlusd-primary/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-rlusd-glow">R</span>
                </div>
                <p className="text-xs text-text-muted">RLUSD</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-sky/10 border border-accent-sky/20 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-7 h-7 text-accent-sky" />
                </div>
                <p className="text-xs text-text-muted">Escrow</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-7 h-7 text-accent-violet" />
                </div>
                <p className="text-xs text-text-muted">DID</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-rlusd-primary/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            className="card p-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rlusd-primary/20 to-rlusd-primary/5 flex items-center justify-center mx-auto mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Waves className="w-10 h-10 text-rlusd-glow" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-text-primary mb-4">
              Ready to transform maritime finance?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
              Explore the transaction layer that turns shipping voyages into bankable, verifiable assets.
            </p>
            <Link href="/dashboard">
              <motion.button
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium text-lg hover:shadow-glow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore the Transaction Layer
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                <Ship className="w-5 h-5 text-rlusd-glow" />
              </div>
              <span className="font-display text-lg font-semibold text-text-primary">Maritime Finance</span>
            </div>
            <p className="text-sm text-text-muted">
              Built on XRP Ledger • Powered by RLUSD
            </p>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
              <Link href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</Link>
              <Link href="#for-who" className="hover:text-text-primary transition-colors">Who It's For</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
