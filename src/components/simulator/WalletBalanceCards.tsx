'use client';

import { motion } from 'framer-motion';
import { Ship, DollarSign, Building2, Shield, RefreshCw } from 'lucide-react';
import { WalletConfig } from '@/types/waterfall';
import { dropsToXRP } from '@/lib/xrpl/wallets';

interface WalletBalanceCardsProps {
  wallets: {
    charterer: WalletConfig;
    investor: WalletConfig;
    shipowner: WalletConfig;
    platform: WalletConfig;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function WalletBalanceCards({
  wallets,
  onRefresh,
  isRefreshing = false,
}: WalletBalanceCardsProps) {
  const walletConfigs = [
    {
      key: 'charterer',
      wallet: wallets.charterer,
      label: 'Charterer',
      icon: Ship,
      color: 'accent-sky',
    },
    {
      key: 'investor',
      wallet: wallets.investor,
      label: 'Investor',
      icon: DollarSign,
      color: 'rlusd-primary',
    },
    {
      key: 'shipowner',
      wallet: wallets.shipowner,
      label: 'Shipowner',
      icon: Building2,
      color: 'accent-amber',
    },
    {
      key: 'platform',
      wallet: wallets.platform,
      label: 'Platform',
      icon: Shield,
      color: 'accent-violet',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Wallet Balances
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-maritime-slate/30 border border-white/10 hover:border-rlusd-primary/30 text-text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {walletConfigs.map(({ key, wallet, label, icon: Icon, color }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-${color}/20 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
                <p className="text-xs text-text-muted truncate font-mono">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}
                </p>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-2">
              <p className="text-xs text-text-muted mb-1">Balance</p>
              <p className={`text-2xl font-mono font-bold text-${color}`}>
                {wallet.balance ? dropsToXRP(wallet.balance).toFixed(2) : '-.--'}
              </p>
              <p className="text-xs text-text-muted mt-1">XRP</p>
            </div>

            {/* Last Updated */}
            {wallet.lastUpdated && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-text-muted">
                  Updated{' '}
                  {new Date(wallet.lastUpdated).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Unfunded Warning */}
            {wallet.balance === '0' && (
              <div className="mt-2 p-2 rounded bg-accent-amber/10 border border-accent-amber/30">
                <p className="text-xs text-accent-amber">Unfunded - needs testnet XRP</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
