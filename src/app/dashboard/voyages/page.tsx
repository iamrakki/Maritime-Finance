'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Ship,
  Plus,
  Filter,
  ArrowUpDown,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Anchor,
} from 'lucide-react';
import { Voyage, STORAGE_KEYS } from '@/types/voyage';

export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'progress' | 'value'>('date');

  useEffect(() => {
    loadVoyages();
  }, []);

  const loadVoyages = () => {
    const voyageList: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.voyageList) || '[]');
    const loadedVoyages: Voyage[] = [];

    voyageList.forEach((id) => {
      const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(id));
      if (voyageData) {
        loadedVoyages.push(JSON.parse(voyageData));
      }
    });

    setVoyages(loadedVoyages);
  };

  const filteredVoyages = voyages
    .filter((v) => {
      if (filter === 'all') return true;
      return v.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'progress') {
        return b.currentProgress - a.currentProgress;
      }
      if (sortBy === 'value') {
        return b.contractValue - a.contractValue;
      }
      return 0;
    });

  const stats = {
    total: voyages.length,
    active: voyages.filter((v) => v.status === 'in_progress').length,
    pendingVerifications: voyages.reduce(
      (sum, v) => sum + v.milestones.filter((m) => m.status === 'awaiting_verification').length,
      0
    ),
    totalValue: voyages.reduce((sum, v) => sum + v.contractValue, 0),
  };

  const getStatusColor = (status: Voyage['status']) => {
    switch (status) {
      case 'in_progress':
        return 'bg-rlusd-primary/20 text-rlusd-glow border-rlusd-primary/40';
      case 'scheduled':
        return 'bg-accent-sky/20 text-accent-sky border-accent-sky/40';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'cancelled':
        return 'bg-accent-coral/20 text-accent-coral border-accent-coral/40';
      default:
        return 'bg-maritime-slate/40 text-text-muted border-white/10';
    }
  };

  const getStatusLabel = (status: Voyage['status']) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Hexagonal grid background */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='1'%3E%3Cpath d='M30 26l-15 8.66V17.34L30 26zm0-26L0 13v26l30 13 30-13V13L30 0z' opacity='.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
      </div>

      {/* Scanline effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="w-full h-full opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 170, 0.03) 2px, rgba(0, 212, 170, 0.03) 4px)',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-rlusd-primary/20 bg-maritime-deeper/95 backdrop-blur-xl">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-rlusd-primary/30 blur-xl" />
                  <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-rlusd-primary/40 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/50">
                    <Navigation className="w-7 h-7 text-rlusd-glow" />
                  </div>
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight uppercase">
                    Voyage Command
                  </h1>
                  <p className="text-sm text-text-muted font-mono mt-1">Fleet Operations Management</p>
                </div>
              </div>

              <Link href="/dashboard/voyages/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative px-6 py-3 bg-gradient-to-r from-rlusd-primary to-rlusd-glow text-maritime-dark font-bold rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="relative flex items-center gap-2 uppercase tracking-wide text-sm">
                    <Plus className="w-5 h-5" />
                    New Voyage
                  </div>
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-4 gap-6">
            {[
              {
                label: 'Total Voyages',
                value: stats.total,
                icon: Ship,
                color: 'text-text-primary',
                bg: 'bg-maritime-steel/60',
              },
              {
                label: 'Active Routes',
                value: stats.active,
                icon: Navigation,
                color: 'text-rlusd-glow',
                bg: 'bg-rlusd-primary/10',
              },
              {
                label: 'Pending Verifications',
                value: stats.pendingVerifications,
                icon: AlertCircle,
                color: 'text-accent-amber',
                bg: 'bg-accent-amber/10',
              },
              {
                label: 'Total Contract Value',
                value: `$${(stats.totalValue / 1000000).toFixed(1)}M`,
                icon: DollarSign,
                color: 'text-accent-sky',
                bg: 'bg-accent-sky/10',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group ${stat.bg} backdrop-blur-xl rounded-xl border border-white/10 p-6 overflow-hidden`}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px]" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className={`text-4xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-rlusd-primary/0 via-rlusd-primary/0 to-rlusd-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="px-8 pb-6">
          <div className="flex items-center gap-4">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-maritime-steel/40 backdrop-blur-xl rounded-lg border border-white/10 p-1">
              <Filter className="w-4 h-4 text-text-muted ml-3" />
              {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-md text-sm font-mono uppercase transition-all ${
                    filter === f
                      ? 'bg-rlusd-primary text-maritime-dark font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 bg-maritime-steel/40 backdrop-blur-xl rounded-lg border border-white/10 p-1">
              <ArrowUpDown className="w-4 h-4 text-text-muted ml-3" />
              {(['date', 'progress', 'value'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-4 py-2 rounded-md text-sm font-mono uppercase transition-all ${
                    sortBy === s
                      ? 'bg-accent-sky text-maritime-dark font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voyage Cards */}
        <div className="px-8 pb-12">
          {filteredVoyages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Anchor className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
              <p className="text-text-muted font-mono">No voyages found. Create your first voyage to get started.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredVoyages.map((voyage, index) => (
                <motion.div
                  key={voyage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/dashboard/voyages/${voyage.id}`}>
                    <div className="group relative bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 hover:border-rlusd-primary/40 p-6 transition-all duration-300 overflow-hidden">
                      {/* Diagonal accent line */}
                      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-rlusd-primary/50 via-rlusd-primary/20 to-transparent transform rotate-12 origin-top-right" />

                      <div className="relative flex items-start justify-between">
                        {/* Left Section */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            {/* Ship Icon */}
                            <div className="relative mt-1">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/40">
                                <Ship className="w-6 h-6 text-rlusd-glow" />
                              </div>
                            </div>

                            {/* Voyage Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-display text-xl font-bold text-text-primary uppercase">
                                  {voyage.vesselName}
                                </h3>
                                <span className="font-mono text-sm text-text-muted">#{voyage.voyageNumber}</span>
                                <div
                                  className={`px-3 py-1 rounded-md border text-xs font-bold font-mono ${getStatusColor(
                                    voyage.status
                                  )}`}
                                >
                                  {getStatusLabel(voyage.status)}
                                </div>
                              </div>

                              {/* Route */}
                              <div className="flex items-center gap-3 text-text-secondary mb-4">
                                <MapPin className="w-4 h-4 text-accent-sky" />
                                <span className="font-mono text-sm">
                                  {voyage.origin.name} → {voyage.destination.name}
                                </span>
                                <span className="text-text-muted text-xs">
                                  {voyage.totalDistance.toLocaleString()} nm
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-mono text-text-muted uppercase">Voyage Progress</span>
                                  <span className="text-sm font-mono font-bold text-rlusd-glow">
                                    {voyage.currentProgress}%
                                  </span>
                                </div>
                                <div className="h-2 bg-maritime-slate/50 rounded-full overflow-hidden border border-white/5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${voyage.currentProgress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-rlusd-primary to-rlusd-glow relative"
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                  </motion.div>
                                </div>
                              </div>

                              {/* Bottom Info */}
                              <div className="flex items-center gap-6 text-sm">
                                {/* Milestones */}
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-rlusd-glow" />
                                  <span className="font-mono text-text-muted">
                                    {voyage.milestonesCompleted}/{voyage.milestonesTotal} Milestones
                                  </span>
                                </div>

                                {/* Next Milestone */}
                                {voyage.nextMilestone && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-accent-amber" />
                                    <span className="font-mono text-text-muted text-xs">
                                      Next: {voyage.nextMilestone.name}
                                    </span>
                                  </div>
                                )}

                                {/* Contract Value */}
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-accent-sky" />
                                  <span className="font-mono text-text-muted">
                                    ${(voyage.contractValue / 1000).toLocaleString()}K
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-rlusd-primary/20 hover:bg-rlusd-primary/30 text-rlusd-glow rounded-lg border border-rlusd-primary/40 font-mono text-sm uppercase transition-all"
                          >
                            View Details
                          </motion.button>

                          {voyage.invoiceIds.length > 0 && (
                            <div className="px-3 py-1 bg-accent-sky/20 text-accent-sky rounded-md border border-accent-sky/40 font-mono text-xs">
                              {voyage.invoiceIds.length} Invoice{voyage.invoiceIds.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-rlusd-primary/0 via-rlusd-primary/5 to-rlusd-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
