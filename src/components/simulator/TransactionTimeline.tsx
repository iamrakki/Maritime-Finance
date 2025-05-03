'use client';

import { motion } from 'framer-motion';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ship,
  DollarSign,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { WaterfallTransaction } from '@/types/waterfall';
import { XRPL_TESTNET_EXPLORER } from '@/types/waterfall';

interface TransactionTimelineProps {
  transactions: WaterfallTransaction[];
}

export default function TransactionTimeline({ transactions }: TransactionTimelineProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'charterer_payment':
        return <Ship className="w-4 h-4" />;
      case 'investor_recovery':
        return <DollarSign className="w-4 h-4" />;
      case 'shipowner_payment':
        return <Building2 className="w-4 h-4" />;
      case 'early_repayment':
      case 'penalty_fee':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'charterer_payment':
        return 'Charterer Payment';
      case 'investor_recovery':
        return 'Investor Recovery';
      case 'shipowner_payment':
        return 'Shipowner Payment';
      case 'early_repayment':
        return 'Early Repayment';
      case 'penalty_fee':
        return 'Penalty Fee';
      case 'default_coverage':
        return 'Default Coverage';
      default:
        return 'Transaction';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-rlusd-glow" />;
      case 'submitted':
      case 'pending':
        return <Clock className="w-4 h-4 text-accent-amber animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-accent-coral" />;
      default:
        return <Clock className="w-4 h-4 text-text-muted" />;
    }
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (transactions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-maritime-slate/30 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
          No Transactions Yet
        </h3>
        <p className="text-sm text-text-muted">
          Transactions will appear here once payments are processed
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-semibold text-text-primary mb-4">
        Transaction History
      </h3>

      <div className="space-y-3">
        {sortedTransactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5 hover:border-rlusd-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'charterer_payment' ? 'bg-accent-sky/20 text-accent-sky' :
                  tx.type === 'investor_recovery' ? 'bg-rlusd-primary/20 text-rlusd-glow' :
                  tx.type === 'shipowner_payment' ? 'bg-accent-amber/20 text-accent-amber' :
                  'bg-accent-coral/20 text-accent-coral'
                }`}>
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {getTransactionLabel(tx.type)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(tx.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(tx.status)}
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">Amount</span>
              <span className="text-lg font-mono font-bold text-rlusd-glow">
                {tx.amountXRP?.toFixed(6)} XRP
              </span>
            </div>

            {/* Addresses */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">From</span>
                <span className="font-mono text-text-primary">
                  {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">To</span>
                <span className="font-mono text-text-primary">
                  {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                </span>
              </div>
            </div>

            {/* Transaction Hash Link */}
            {tx.hash && (
              <div className="pt-3 border-t border-white/5">
                <a
                  href={`${XRPL_TESTNET_EXPLORER}/transactions/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-accent-sky hover:text-accent-sky/80 transition-colors"
                >
                  <span className="font-mono">{tx.hash.slice(0, 16)}...</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Error Message */}
            {tx.status === 'failed' && tx.errorMessage && (
              <div className="mt-2 p-2 rounded bg-accent-coral/10 border border-accent-coral/30">
                <p className="text-xs text-accent-coral">{tx.errorMessage}</p>
              </div>
            )}

            {/* Notes */}
            {tx.notes && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-xs text-text-muted italic">{tx.notes}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
