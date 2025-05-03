'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';
import { InvestorRecovery } from '@/types/waterfall';

interface InvestorRecoveryTrackerProps {
  recovery: InvestorRecovery;
}

export default function InvestorRecoveryTracker({ recovery }: InvestorRecoveryTrackerProps) {
  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rlusd-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-rlusd-glow" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              Investor Recovery
            </h3>
            <p className="text-xs text-text-muted">Principal + Interest Tracking</p>
          </div>
        </div>
        {recovery.isFullyRecovered && (
          <div className="px-3 py-1.5 rounded-full bg-rlusd-primary/20 border border-rlusd-primary/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rlusd-glow" />
            <span className="text-sm font-medium text-rlusd-glow">Fully Recovered</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-muted">Recovery Progress</span>
          <span className="text-lg font-mono font-bold text-rlusd-glow">
            {recovery.percentageRecovered.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-maritime-slate/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${recovery.percentageRecovered}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-rlusd-dim to-rlusd-glow rounded-full relative"
          >
            {recovery.percentageRecovered > 10 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Principal */}
        <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-accent-sky" />
            <span className="text-xs text-text-muted uppercase tracking-wider">Principal</span>
          </div>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {recovery.principal.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-1">Original Loan</p>
        </div>

        {/* Interest */}
        <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent-amber" />
            <span className="text-xs text-text-muted uppercase tracking-wider">Interest</span>
          </div>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {recovery.interestAmount.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-1">{recovery.interestRate}% Rate</p>
        </div>
      </div>

      {/* Recovery Status */}
      <div className="space-y-3">
        {/* Total Target */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/20">
          <span className="text-sm font-medium text-text-primary">Total Target</span>
          <span className="text-lg font-mono font-bold text-rlusd-glow">
            {recovery.totalTarget.toFixed(2)} XRP
          </span>
        </div>

        {/* Recovered */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-maritime-slate/20 border border-white/5">
          <span className="text-sm font-medium text-text-primary">Recovered</span>
          <span className="text-lg font-mono font-bold text-accent-sky">
            {recovery.recovered.toFixed(2)} XRP
          </span>
        </div>

        {/* Remaining */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-maritime-slate/20 border border-white/5">
          <span className="text-sm font-medium text-text-primary">Remaining</span>
          <span className={`text-lg font-mono font-bold ${
            recovery.remaining > 0 ? 'text-accent-coral' : 'text-text-muted'
          }`}>
            {recovery.remaining.toFixed(2)} XRP
          </span>
        </div>
      </div>

      {/* Recovery Date */}
      {recovery.isFullyRecovered && recovery.recoveredAt && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Fully Recovered On</span>
            <span className="text-text-primary font-medium">
              {new Date(recovery.recoveredAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
