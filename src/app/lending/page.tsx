'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Ship,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  MapPin,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

const loans = [
  {
    id: 'loan-001',
    vessel: 'MV Pacific Meridian',
    route: 'Singapore → Rotterdam',
    loanAmount: 2850000,
    apy: 8.5,
    duration: 45,
    terScore: 847,
    riskLevel: 'Low',
    progress: 0,
    status: 'active',
    chartererReputation: 'AA+',
    collateralRatio: 125,
    isActive: true
  },
  {
    id: 'loan-002',
    vessel: 'MV Atlantic Venture',
    route: 'Houston → Hamburg',
    loanAmount: 1920000,
    apy: 9.2,
    duration: 38,
    terScore: 782,
    riskLevel: 'Low',
    progress: 0,
    status: 'active',
    chartererReputation: 'A+',
    collateralRatio: 130,
    isActive: false
  },
  {
    id: 'loan-003',
    vessel: 'MV Northern Star',
    route: 'Shanghai → Los Angeles',
    loanAmount: 3200000,
    apy: 7.8,
    duration: 52,
    terScore: 891,
    riskLevel: 'Very Low',
    progress: 0,
    status: 'active',
    chartererReputation: 'AAA',
    collateralRatio: 140,
    isActive: false
  },
  {
    id: 'loan-004',
    vessel: 'MV Ocean Pioneer',
    route: 'Dubai → New York',
    loanAmount: 2150000,
    apy: 9.8,
    duration: 41,
    terScore: 723,
    riskLevel: 'Medium',
    progress: 0,
    status: 'active',
    chartererReputation: 'A',
    collateralRatio: 115,
    isActive: false
  },
  {
    id: 'loan-005',
    vessel: 'MV Baltic Express',
    route: 'Rotterdam → Tokyo',
    loanAmount: 2680000,
    apy: 8.1,
    duration: 48,
    terScore: 816,
    riskLevel: 'Low',
    progress: 0,
    status: 'active',
    chartererReputation: 'AA',
    collateralRatio: 128,
    isActive: false
  },
  {
    id: 'loan-006',
    vessel: 'MV Mediterranean Trader',
    route: 'Barcelona → Istanbul',
    loanAmount: 1450000,
    apy: 10.5,
    duration: 28,
    terScore: 694,
    riskLevel: 'Medium',
    progress: 0,
    status: 'active',
    chartererReputation: 'BBB+',
    collateralRatio: 110,
    isActive: false
  }
];

export default function LendingPage() {
  const [sortBy, setSortBy] = useState('terScore');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Very Low':
        return 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30';
      case 'Low':
        return 'bg-accent-sky/20 text-accent-sky border border-accent-sky/30';
      case 'Medium':
        return 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30';
      default:
        return 'bg-maritime-slate/30 text-text-muted border border-white/10';
    }
  };

  const getTERScoreColor = (score: number) => {
    if (score >= 850) return 'text-rlusd-glow';
    if (score >= 750) return 'text-accent-sky';
    if (score >= 650) return 'text-accent-amber';
    return 'text-accent-coral';
  };

  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                <Ship className="w-5 h-5 text-rlusd-glow" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-text-primary tracking-tight">
                  Voyage Lending Pool
                </h1>
                <p className="text-xs text-text-muted">Transaction-backed maritime financing</p>
              </div>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-text-muted">Total Pool Value</span>
              <DollarSign className="w-5 h-5 text-rlusd-primary" />
            </div>
            <p className="text-3xl font-mono font-bold text-text-primary mb-1">$14.25M</p>
            <p className="text-xs text-rlusd-glow font-medium">+12.3% this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-text-muted">Avg. APY</span>
              <TrendingUp className="w-5 h-5 text-rlusd-glow" />
            </div>
            <p className="text-3xl font-mono font-bold text-rlusd-glow mb-1">8.98%</p>
            <p className="text-xs text-text-muted">Weighted average</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-text-muted">Active Loans</span>
              <Ship className="w-5 h-5 text-accent-sky" />
            </div>
            <p className="text-3xl font-mono font-bold text-text-primary mb-1">6</p>
            <p className="text-xs text-text-muted">Across 4 routes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-text-muted">Avg. TER Score</span>
              <Shield className="w-5 h-5 text-rlusd-glow" />
            </div>
            <p className="text-3xl font-mono font-bold text-text-primary mb-1">789</p>
            <p className="text-xs text-rlusd-glow font-medium">Excellent rating</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="card px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-rlusd-primary/30 transition-all flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="card px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-rlusd-primary/30 transition-all flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Risk Level
            </button>
          </div>
          <button className="card px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-rlusd-primary/30 transition-all flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Sort by TER Score
          </button>
        </div>

        {/* Loan List */}
        <div className="space-y-4">
          {loans.map((loan, index) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              {loan.isActive ? (
                <Link href={`/lending/${loan.id}`}>
                  <div className="card p-6 cursor-pointer group transition-all hover:border-white/10 hover:shadow-glow-sm">
                    {/* Main row */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center">
                      {/* 1. Vessel & Route */}
                      <div className="flex items-center gap-3 min-w-[280px]">
                        <div className="w-12 h-12 rounded-xl bg-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                          <Ship className="w-6 h-6 text-rlusd-glow" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-text-primary mb-1">{loan.vessel}</h3>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{loan.route}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Loan Amount */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Loan Amount</p>
                        <p className="text-xl font-mono font-bold text-text-primary">
                          ${(loan.loanAmount / 1000000).toFixed(2)}M
                        </p>
                      </div>

                      {/* 3. APY */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">APY</p>
                        <p className="text-xl font-mono font-bold text-rlusd-glow">{loan.apy}%</p>
                      </div>

                      {/* 4. TER Score */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">TER Score</p>
                        <p className={`text-lg font-mono font-bold ${getTERScoreColor(loan.terScore)}`}>
                          {loan.terScore}
                        </p>
                      </div>

                      {/* 5. Risk Level */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Risk</p>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(loan.riskLevel)}`}>
                          {loan.riskLevel}
                        </div>
                      </div>

                      {/* 6. Duration & Progress */}
                      <div className="text-center min-w-[100px]">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Duration</p>
                        <p className="text-lg font-semibold text-text-primary">{loan.duration} days</p>
                        <div className="mt-2 h-1.5 bg-maritime-mist/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rlusd-dim to-rlusd-glow rounded-full transition-all duration-1000"
                               style={{ width: `${loan.progress}%` }} />
                        </div>
                      </div>

                      {/* 7. Action Icon */}
                      <div>
                        <ChevronRight className="w-5 h-5 text-rlusd-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Secondary info row */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <span>Charterer:</span>
                        <span className="font-semibold text-text-primary">{loan.chartererReputation}</span>
                      </div>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span>Collateral:</span>
                        <span className="font-semibold text-text-primary">{loan.collateralRatio}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="card p-6 opacity-60 cursor-not-allowed relative overflow-hidden">
                  {/* Locked overlay */}
                  <div className="absolute inset-0 bg-maritime-dark/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 px-4 py-2 card shadow-sm">
                      <Lock className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">Coming Soon</span>
                    </div>
                  </div>

                  <div className="relative">
                    {/* Same structure as active loan */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center">
                      <div className="flex items-center gap-3 min-w-[280px]">
                        <div className="w-12 h-12 rounded-xl bg-maritime-slate/30 flex items-center justify-center border border-white/10">
                          <Ship className="w-6 h-6 text-text-muted" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-text-primary mb-1">{loan.vessel}</h3>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{loan.route}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Loan Amount</p>
                        <p className="text-xl font-mono font-bold text-text-primary">
                          ${(loan.loanAmount / 1000000).toFixed(2)}M
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">APY</p>
                        <p className="text-xl font-mono font-bold text-rlusd-glow">{loan.apy}%</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">TER Score</p>
                        <p className={`text-lg font-mono font-bold ${getTERScoreColor(loan.terScore)}`}>
                          {loan.terScore}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Risk</p>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(loan.riskLevel)}`}>
                          {loan.riskLevel}
                        </div>
                      </div>

                      <div className="text-center min-w-[100px]">
                        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Duration</p>
                        <p className="text-lg font-semibold text-text-primary">{loan.duration} days</p>
                        <div className="mt-2 h-1.5 bg-maritime-mist/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rlusd-dim to-rlusd-glow rounded-full"
                               style={{ width: `${loan.progress}%` }} />
                        </div>
                      </div>

                      <div>
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <span>Charterer:</span>
                        <span className="font-semibold text-text-primary">{loan.chartererReputation}</span>
                      </div>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span>Collateral:</span>
                        <span className="font-semibold text-text-primary">{loan.collateralRatio}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
