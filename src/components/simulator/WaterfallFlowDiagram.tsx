'use client';

import { motion } from 'framer-motion';
import { ArrowDown, DollarSign, Shield, Ship, User, Building2 } from 'lucide-react';
import { WaterfallDistribution } from '@/types/waterfall';

interface WaterfallFlowDiagramProps {
  distribution?: WaterfallDistribution;
  isAnimating?: boolean;
}

export default function WaterfallFlowDiagram({
  distribution,
  isAnimating = false,
}: WaterfallFlowDiagramProps) {
  const hasDistribution = distribution !== undefined;

  return (
    <div className="relative">
      {/* Title */}
      <div className="text-center mb-8">
        <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
          Waterfall Payment Flow
        </h3>
        <p className="text-sm text-text-muted">
          Investor paid first, then shipowner receives remainder
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="space-y-6">
        {/* Charterer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-full max-w-xs p-4 rounded-xl bg-accent-sky/10 border border-accent-sky/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Ship className="w-5 h-5 text-accent-sky" />
              <span className="font-semibold text-text-primary">Charterer</span>
            </div>
            {hasDistribution && distribution && (
              <p className="text-2xl font-mono font-bold text-accent-sky">
                {distribution.totalAmount.toFixed(2)} XRP
              </p>
            )}
            <p className="text-xs text-text-muted mt-1">Voyage Payment</p>
          </div>
        </motion.div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <motion.div
            animate={isAnimating ? { y: [0, 10, 0] } : {}}
            transition={{ duration: 1, repeat: isAnimating ? Infinity : 0 }}
          >
            <ArrowDown className="w-8 h-8 text-rlusd-glow" />
          </motion.div>
        </div>

        {/* Platform Hook */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-full max-w-xs p-4 rounded-xl bg-rlusd-primary/10 border-2 border-rlusd-primary/30 text-center relative overflow-hidden">
            {isAnimating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-rlusd-primary/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-rlusd-glow" />
                <span className="font-semibold text-text-primary">Platform Hook</span>
              </div>
              <p className="text-xs text-text-muted">Waterfall Distribution Logic</p>
            </div>
          </div>
        </motion.div>

        {/* Distribution Arrows */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-end">
            <motion.div
              animate={isAnimating ? { y: [0, 10, 0] } : {}}
              transition={{ duration: 1, delay: 0.2, repeat: isAnimating ? Infinity : 0 }}
            >
              <ArrowDown className="w-6 h-6 text-rlusd-glow" />
            </motion.div>
          </div>
          <div className="flex justify-start">
            <motion.div
              animate={isAnimating ? { y: [0, 10, 0] } : {}}
              transition={{ duration: 1, delay: 0.4, repeat: isAnimating ? Infinity : 0 }}
            >
              <ArrowDown className="w-6 h-6 text-rlusd-glow" />
            </motion.div>
          </div>
        </div>

        {/* Recipients */}
        <div className="grid grid-cols-2 gap-4">
          {/* Investor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`p-4 rounded-xl border-2 text-center ${
              hasDistribution && distribution && distribution.toInvestor > 0
                ? 'bg-rlusd-primary/20 border-rlusd-primary/50'
                : 'bg-maritime-slate/20 border-white/10'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className={`w-5 h-5 ${
                  hasDistribution && distribution && distribution.toInvestor > 0 ? 'text-rlusd-glow' : 'text-text-muted'
                }`} />
                <span className="font-semibold text-text-primary">Investor</span>
              </div>
              {hasDistribution && distribution && (
                <>
                  <p className={`text-xl font-mono font-bold ${
                    distribution.toInvestor > 0 ? 'text-rlusd-glow' : 'text-text-muted'
                  }`}>
                    {distribution.toInvestor.toFixed(2)} XRP
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {distribution.investorFullyPaid ? '✓ Fully Recovered' : 'Priority Payment'}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Shipowner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`p-4 rounded-xl border-2 text-center ${
              hasDistribution && distribution && distribution.toShipowner > 0
                ? 'bg-accent-amber/20 border-accent-amber/50'
                : 'bg-maritime-slate/20 border-white/10'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className={`w-5 h-5 ${
                  hasDistribution && distribution && distribution.toShipowner > 0 ? 'text-accent-amber' : 'text-text-muted'
                }`} />
                <span className="font-semibold text-text-primary">Shipowner</span>
              </div>
              {hasDistribution && distribution && (
                <>
                  <p className={`text-xl font-mono font-bold ${
                    distribution.toShipowner > 0 ? 'text-accent-amber' : 'text-text-muted'
                  }`}>
                    {distribution.toShipowner.toFixed(2)} XRP
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {distribution.toShipowner > 0 ? 'Remainder' : 'Waiting...'}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Distribution Details */}
        {hasDistribution && distribution && distribution.calculation && distribution.calculation.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-4 rounded-lg bg-maritime-slate/30 border border-white/5"
          >
            <h4 className="text-sm font-semibold text-text-primary mb-3">Distribution Logic</h4>
            <div className="space-y-2">
              {distribution.calculation.map((step, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{step.step}</span>
                  <span className="font-mono text-text-primary">{step.amount.toFixed(2)} XRP</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
