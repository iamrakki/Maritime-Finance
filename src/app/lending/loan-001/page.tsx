'use client';

import Link from 'next/link';
import {
  Ship,
  TrendingUp,
  MapPin,
  DollarSign,
  Shield,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import LoanRouteMap from './LoanRouteMap';

export default function LoanDetailPage() {
  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/lending">
              <button className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back to Pool</span>
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30">
                Low Risk
              </div>
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-accent-sky/20 text-accent-sky border border-accent-sky/30">
                Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Vessel Header */}
      <section className="bg-maritime-deeper/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
              <Ship className="w-8 h-8 text-rlusd-glow" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">MV Pacific Meridian</h1>
              <div className="flex items-center gap-2 text-text-muted mt-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Singapore → Rotterdam</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT - 2/3 Map + 1/3 Data Layout */}
      <section className="bg-maritime-dark py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6">

            {/* LEFT COLUMN (2/3) - Map + Route Stats */}
            <div className="col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
                  Voyage Route
                </h2>
                <LoanRouteMap />
              </div>

              {/* Route statistics below map */}
              <div className="grid grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Distance</p>
                  <p className="text-xl font-mono font-bold text-text-primary">8,288 nm</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Duration</p>
                  <p className="text-xl font-mono font-bold text-text-primary">45 days</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Avg Speed</p>
                  <p className="text-xl font-mono font-bold text-text-primary">14.2 kts</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Waypoints</p>
                  <p className="text-xl font-mono font-bold text-text-primary">17</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3) - Continuous Data Panel */}
            <div className="col-span-1">
              <div className="rounded-xl bg-maritime-slate/20 border border-white/5 divide-y divide-white/5 overflow-hidden">

                {/* Expected Return Section */}
                <div className="p-5 bg-gradient-to-br from-rlusd-primary/10 to-transparent">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-rlusd-glow" />
                    <span className="text-xs font-semibold text-rlusd-glow uppercase tracking-wider">
                      Expected Return
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-3xl font-mono font-bold text-rlusd-glow">$29,813</p>
                    <p className="text-xs text-rlusd-primary">1.05% yield</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-rlusd-primary/20">
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">Principal</p>
                      <p className="text-sm font-mono font-semibold text-text-primary">$2.85M</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">APY</p>
                      <p className="text-sm font-mono font-semibold text-rlusd-glow">8.5%</p>
                    </div>
                  </div>
                </div>

                {/* Default Risk Section */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-accent-sky" />
                    <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Default Risk
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-3xl font-mono font-bold text-rlusd-glow">0.3%</p>
                    <p className="text-xs text-text-secondary">Very Low</p>
                  </div>
                  <div className="h-1.5 bg-maritime-mist/30 rounded-full relative overflow-hidden">
                    <div className="absolute h-full bg-gradient-to-r from-rlusd-glow via-accent-sky to-accent-amber rounded-full" style={{ width: '100%' }} />
                    <div className="absolute left-[0.3%] w-3 h-3 rounded-full bg-white shadow-glow-lg border border-rlusd-glow top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Risk Assessment Section */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Risk Assessment
                    </h3>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-text-primary">847</p>
                      <p className="text-xs text-rlusd-glow">TER Score</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Charterer Credit</span>
                        <span className="text-xs font-bold text-rlusd-glow">AA+</span>
                      </div>
                      <div className="h-1 bg-maritime-mist/30 rounded-full overflow-hidden">
                        <div className="h-full bg-rlusd-glow rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Route Risk</span>
                        <span className="text-xs font-bold text-accent-sky">Low</span>
                      </div>
                      <div className="h-1 bg-maritime-mist/30 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-sky rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Vessel Performance</span>
                        <span className="text-xs font-bold text-rlusd-glow">98.5%</span>
                      </div>
                      <div className="h-1 bg-maritime-mist/30 rounded-full overflow-hidden">
                        <div className="h-full bg-rlusd-glow rounded-full" style={{ width: '98.5%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Breakdown Section */}
                <div className="p-5">
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
                    Return Breakdown
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Principal</span>
                      <span className="font-mono font-semibold text-text-primary">$2,850,000</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-rlusd-glow">Interest (8.5%)</span>
                      <span className="font-mono font-semibold text-rlusd-glow">+$29,813</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-t border-white/10">
                      <span className="font-semibold text-accent-sky">Total Return</span>
                      <span className="font-mono font-bold text-accent-sky">$2,879,813</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Net Yield</span>
                      <span className="font-mono font-semibold text-rlusd-glow">1.05%</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-text-muted">
                      <Clock className="w-3 h-3 text-accent-sky shrink-0" />
                      <span>Feb 22, 2026 (45 days)</span>
                    </div>
                  </div>
                </div>

                {/* Vessel Profile Section */}
                <div className="p-5">
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
                    Vessel Profile
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-rlusd-glow" />
                        <span className="text-text-muted">Credit Score</span>
                      </div>
                      <span className="text-lg font-mono font-bold text-rlusd-glow">920</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Voyages</span>
                        <span className="font-mono font-semibold text-accent-sky">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">On-Time</span>
                        <span className="font-mono font-semibold text-accent-violet">98.5%</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Total Volume</span>
                      <span className="font-mono font-semibold text-text-primary">$42.8M</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Verified Since</span>
                      <span className="font-mono font-semibold text-text-primary">Jan 2023</span>
                    </div>

                    <div className="flex justify-between py-1.5 pt-2 border-t border-white/10">
                      <span className="text-text-muted">Charterer Rating</span>
                      <span className="font-mono font-semibold text-rlusd-glow">AA+</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
