'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Navigation,
  FileText,
  Play,
  Pause,
  Target,
  TrendingUp,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { Voyage, Milestone, STORAGE_KEYS } from '@/types/voyage';
import { runSimulationLoop } from '@/lib/voyageSimulation';

// Dynamically import Leaflet map (client-side only)
const VoyageMap = dynamic(() => import('./VoyageMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-maritime-dark/50">
      <p className="font-mono text-text-muted">Loading map...</p>
    </div>
  ),
});

export default function VoyageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const voyageId = params.id as string;

  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkedInvoices, setLinkedInvoices] = useState<any[]>([]);
  const [invoicesExpanded, setInvoicesExpanded] = useState(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadVoyage();
  }, [voyageId]);

  // Simulation loop - runs every 5 seconds for all active voyages
  useEffect(() => {
    const interval = setInterval(() => {
      runSimulationLoop();
      // Reload voyage data to reflect updates
      loadVoyage();
    }, 5000);

    return () => clearInterval(interval);
  }, [voyageId]);

  // Load linked invoices when voyage changes
  useEffect(() => {
    if (voyage && voyage.invoiceIds.length > 0) {
      const invoices: any[] = [];
      voyage.invoiceIds.forEach((invoiceId) => {
        // Try voyage-invoice storage first
        let data = localStorage.getItem(STORAGE_KEYS.voyageInvoice(invoiceId));
        // Fallback to regular invoice storage
        if (!data) {
          data = localStorage.getItem(invoiceId);
        }
        if (data) {
          invoices.push(JSON.parse(data));
        }
      });
      setLinkedInvoices(invoices);
    } else {
      setLinkedInvoices([]);
    }
  }, [voyage]);

  const loadVoyage = () => {
    const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
    if (voyageData) {
      setVoyage(JSON.parse(voyageData));
    }
    setLoading(false);
  };

  const getMilestoneStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-rlusd-primary/20 text-rlusd-glow border-rlusd-primary/40';
      case 'awaiting_verification':
        return 'bg-accent-amber/20 text-accent-amber border-accent-amber/40';
      case 'in_progress':
        return 'bg-accent-sky/20 text-accent-sky border-accent-sky/40';
      case 'disputed':
        return 'bg-accent-coral/20 text-accent-coral border-accent-coral/40';
      default:
        return 'bg-maritime-slate/40 text-text-muted border-white/10';
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'awaiting_verification':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Navigation className="w-4 h-4 animate-pulse" />;
      case 'disputed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const toggleSimulation = () => {
    if (!voyage) return;

    const updatedVoyage = {
      ...voyage,
      simulationActive: !voyage.simulationActive,
      status: !voyage.simulationActive ? 'in_progress' as const : voyage.status,
      actualDeparture: !voyage.simulationActive && !voyage.actualDeparture
        ? new Date().toISOString()
        : voyage.actualDeparture,
    };

    setVoyage(updatedVoyage);
    localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(updatedVoyage));
  };

  const copyInvoicePaymentLink = (invoiceId: string) => {
    const link = `${window.location.origin}/dashboard/invoices/pay/${invoiceId}`;
    navigator.clipboard.writeText(link);
    setCopiedInvoiceId(invoiceId);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <p className="font-mono text-text-muted">Loading voyage...</p>
      </div>
    );
  }

  if (!voyage) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-text-muted mb-4">Voyage not found</p>
          <button
            onClick={() => router.push('/dashboard/voyages')}
            className="px-4 py-2 bg-rlusd-primary/20 text-rlusd-glow rounded-lg border border-rlusd-primary/40 font-mono text-sm"
          >
            Back to Voyages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Header */}
      <header className="border-b border-rlusd-primary/20 bg-maritime-deeper/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/voyages')}
                className="p-2 hover:bg-maritime-slate/40 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-muted" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rlusd-primary/40 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/50">
                  <Ship className="w-6 h-6 text-rlusd-glow" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-tight">
                    {voyage.vesselName}
                  </h1>
                  <p className="text-sm font-mono text-text-muted">
                    {voyage.voyageNumber} • {voyage.routeName}
                  </p>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-md border text-xs font-bold font-mono ${
                voyage.status === 'in_progress'
                  ? 'bg-rlusd-primary/20 text-rlusd-glow border-rlusd-primary/40'
                  : voyage.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-accent-sky/20 text-accent-sky border-accent-sky/40'
              }`}>
                {voyage.status.toUpperCase().replace('_', ' ')}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSimulation}
                className={`px-4 py-2 rounded-lg border font-mono text-sm uppercase flex items-center gap-2 transition-all ${
                  voyage.simulationActive
                    ? 'bg-accent-coral/20 text-accent-coral border-accent-coral/40'
                    : 'bg-accent-sky/20 text-accent-sky border-accent-sky/40'
                }`}
              >
                {voyage.simulationActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Sim
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Sim
                  </>
                )}
              </button>

              <button
                onClick={() => router.push(`/dashboard/invoices/create?voyageId=${voyageId}`)}
                className="px-4 py-2 bg-gradient-to-r from-accent-sky to-accent-sky/80 text-maritime-dark font-bold rounded-lg font-mono text-sm uppercase hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left: Map & Timeline (2/3) */}
        <div className="flex-1 flex flex-col border-r border-white/5">
          {/* Map */}
          <div className="flex-1 relative">
            <VoyageMap voyage={voyage} />
          </div>

          {/* Timeline */}
          <div className="border-t border-white/5 bg-maritime-deeper/80 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-text-primary uppercase">
                Milestone Timeline
              </h3>
              <span className="font-mono text-sm text-text-muted">
                {voyage.milestonesCompleted} of {voyage.milestonesTotal} Verified
              </span>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-6 left-0 right-0 h-px bg-white/10" />
              <div
                className="absolute top-6 left-0 h-px bg-gradient-to-r from-rlusd-primary to-transparent transition-all duration-1000"
                style={{ width: `${voyage.currentProgress}%` }}
              />

              {/* Milestones */}
              <div className="flex justify-between relative">
                {voyage.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex flex-col items-center flex-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative z-10 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${getMilestoneStatusColor(
                        milestone.status
                      )}`}
                    >
                      {getStatusIcon(milestone.status)}
                    </motion.div>
                    <p className="mt-2 text-xs font-mono text-text-muted text-center max-w-[100px] line-clamp-2">
                      {milestone.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel (1/3) */}
        <div className="w-[400px] bg-maritime-deeper/50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Progress */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-rlusd-glow" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Progress</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-text-muted uppercase">Voyage Progress</span>
                    <span className="text-2xl font-display font-bold text-rlusd-glow">
                      {voyage.currentProgress}%
                    </span>
                  </div>
                  <div className="h-3 bg-maritime-slate/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-rlusd-primary to-rlusd-glow"
                      initial={{ width: 0 }}
                      animate={{ width: `${voyage.currentProgress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {voyage.currentPosition && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-mono text-text-muted uppercase mb-2">Current Position</p>
                    <p className="font-mono text-sm text-text-primary">
                      {voyage.currentPosition[0].toFixed(4)}°N, {voyage.currentPosition[1].toFixed(4)}°E
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-accent-sky" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Schedule</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase">Departure</span>
                  <span className="font-mono text-sm text-text-primary">
                    {new Date(voyage.scheduledDeparture).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase">ETA</span>
                  <span className="font-mono text-sm text-text-primary">
                    {new Date(voyage.estimatedArrival).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted uppercase">Duration</span>
                  <span className="font-mono text-sm text-text-primary">{voyage.durationDays} days</span>
                </div>
              </div>
            </div>

            {/* Milestones Summary */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-accent-amber" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Milestones</h3>
              </div>

              <div className="space-y-2">
                {voyage.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="p-3 bg-maritime-dark/30 rounded-lg border border-white/5 hover:border-rlusd-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm text-text-primary">{milestone.name}</span>
                      <div className={`px-2 py-0.5 rounded text-xs font-mono ${getMilestoneStatusColor(milestone.status)}`}>
                        {milestone.status.replace('_', ' ')}
                      </div>
                    </div>
                    {milestone.progressPercentage !== undefined && (
                      <p className="text-xs text-text-muted font-mono">{milestone.progressPercentage}% progress</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-accent-sky" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Financial</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Contract Value</p>
                  <p className="text-2xl font-display font-bold text-accent-sky">
                    {voyage.currency} ${voyage.contractValue.toLocaleString()}
                  </p>
                </div>

                {/* Linked Invoices - Expandable */}
                {voyage.invoiceIds.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    {/* Header - Clickable to expand/collapse */}
                    <button
                      onClick={() => setInvoicesExpanded(!invoicesExpanded)}
                      className="w-full flex items-center justify-between hover:bg-maritime-slate/20 -mx-2 px-2 py-1 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent-sky" />
                        <p className="text-xs font-mono text-text-muted uppercase">
                          Linked Invoices ({voyage.invoiceIds.length})
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${
                        invoicesExpanded ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {/* Expandable Invoice List */}
                    {invoicesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 space-y-3"
                      >
                        {linkedInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="p-3 rounded-lg bg-maritime-steel/20 border border-white/5"
                          >
                            {/* Invoice Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm font-semibold text-text-primary truncate">
                                  #{invoice.invoiceNumber}
                                </p>
                                {/* Payment Status Badge */}
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${
                                  invoice.status === 'paid'
                                    ? 'bg-rlusd-primary/20 text-rlusd-glow'
                                    : 'bg-accent-amber/20 text-accent-amber'
                                }`}>
                                  {invoice.status === 'paid' ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Paid
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Amount */}
                              <p className="font-mono text-lg font-bold text-rlusd-glow ml-2">
                                ${invoice.grandTotal.toLocaleString()}
                              </p>
                            </div>

                            {/* Milestone Status - If invoice has milestone references */}
                            {invoice.milestoneReferences && invoice.milestoneReferences.length > 0 && (
                              <div className="mb-2 pb-2 border-b border-white/5">
                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                  <Target className="w-3 h-3" />
                                  <span>
                                    {invoice.milestoneReferences.filter((m: any) => m.milestoneStatus === 'verified').length}
                                    /{invoice.milestoneReferences.length} milestones verified
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Copy Payment Link Button */}
                            <button
                              onClick={() => copyInvoicePaymentLink(invoice.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                copiedInvoiceId === invoice.id
                                  ? 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30'
                                  : 'bg-maritime-slate/30 text-text-primary border border-white/10 hover:bg-maritime-slate/50'
                              }`}
                            >
                              {copiedInvoiceId === invoice.id ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Link Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Payment Link
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ship className="w-5 h-5 text-rlusd-glow" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Parties</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Shipowner</p>
                  <p className="font-mono text-sm text-text-primary">{voyage.shipownerName}</p>
                  {voyage.shipownerCompany && (
                    <p className="text-xs text-text-muted">{voyage.shipownerCompany}</p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Charterer</p>
                  <p className="font-mono text-sm text-text-primary">{voyage.chartererName}</p>
                  {voyage.chartererCompany && (
                    <p className="text-xs text-text-muted">{voyage.chartererCompany}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-accent-violet" />
                <h3 className="font-display text-lg font-bold text-text-primary uppercase">Route</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Origin</p>
                  <p className="font-mono text-sm text-text-primary">{voyage.origin.name}</p>
                </div>

                <div>
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Destination</p>
                  <p className="font-mono text-sm text-text-primary">{voyage.destination.name}</p>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Distance</p>
                  <p className="font-mono text-sm text-text-primary">
                    {voyage.totalDistance.toLocaleString()} nm
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
