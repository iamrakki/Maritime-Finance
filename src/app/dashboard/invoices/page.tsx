'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Ship,
  FileText,
  User,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Navigation,
  Target,
} from 'lucide-react';
import { STORAGE_KEYS } from '@/types/voyage';

export default function InvoicesPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [invoices, setInvoices] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterVoyage, setFilterVoyage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load invoices from localStorage
    const loadInvoices = () => {
      const allInvoices = [];

      // Load voyage invoices
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('voyage-invoice-')) {
          const data = localStorage.getItem(key);
          if (data) {
            allInvoices.push(JSON.parse(data));
          }
        }
      }

      // Load regular invoices (fallback)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('inv-') && !key.startsWith('invoice-')) {
          const data = localStorage.getItem(key);
          if (data) {
            const invoice = JSON.parse(data);
            // Only add if not already loaded as voyage invoice
            if (!allInvoices.find(inv => inv.id === invoice.id)) {
              allInvoices.push(invoice);
            }
          }
        }
      }

      // Sort by creation date, newest first
      allInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(allInvoices);
    };

    loadInvoices();

    // Add event listener for when the page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadInvoices();
      }
    };

    // Add event listener for focus (when user returns to the tab/window)
    const handleFocus = () => {
      loadInvoices();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const copyPaymentLink = (invoiceId: string) => {
    const link = `${window.location.origin}/dashboard/invoices/pay/${invoiceId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invoiceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hardcoded DID details (same as main dashboard)
  const didDetails = {
    companyName: 'Pacific Maritime Trading Co.',
    creditScore: 847,
    totalVoyages: 24,
    onTimeRate: 98.5
  };

  return (
    <div className="min-h-screen bg-maritime-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                <Ship className="w-5 h-5 text-rlusd-glow" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-text-primary">
                  Welcome Captain
                </h1>
                <p className="text-xs text-text-muted">Dashboard Overview</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-text-muted">UTC Time</p>
              <p className="text-sm font-mono text-text-primary">
                {currentTime.toUTCString().slice(17, 25)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Full Profile */}
        <aside className="w-80 border-r border-white/5 bg-maritime-deeper/50 flex flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="p-4 border-b border-white/5">
            <div className="space-y-2">
              <Link href="/dashboard">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-transparent border border-transparent text-text-muted hover:bg-maritime-slate/30 hover:text-text-primary transition-all">
                  <Ship className="w-5 h-5" />
                  <span className="text-sm font-medium">Fleet Map</span>
                </button>
              </Link>

              <Link href="/dashboard/invoices">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 text-rlusd-glow transition-all">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Invoices</span>
                </button>
              </Link>
            </div>
          </nav>

          {/* Full DID Profile in Sidebar */}
          <div className="flex-1 p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Company Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rlusd-primary/20 to-rlusd-primary/5 flex items-center justify-center border border-rlusd-primary/30">
                    <User className="w-6 h-6 text-rlusd-glow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{didDetails.companyName}</h3>
                    <p className="text-xs text-text-muted">Verified Shipowner</p>
                  </div>
                </div>
              </div>

              {/* Credit Score - Prominent */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-rlusd-primary/10 to-rlusd-primary/5 border border-rlusd-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted uppercase tracking-wider">Credit Score</span>
                  <svg className="w-4 h-4 text-rlusd-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-4xl font-mono font-bold text-rlusd-glow mb-1">{didDetails.creditScore}</p>
                <p className="text-xs text-rlusd-primary">Excellent Standing</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-maritime-slate/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-accent-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-text-muted">Voyages</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-text-primary">{didDetails.totalVoyages}</p>
                </div>

                <div className="p-4 rounded-xl bg-maritime-slate/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-accent-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-text-muted">On-Time</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-accent-sky">{didDetails.onTimeRate}%</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Verified Since */}
              <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Verified Since</span>
                  <span className="text-sm font-medium text-text-primary">Jan 2023</span>
                </div>
              </div>
            </motion.div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-1">
                  Freight Invoices
                </h2>
                <p className="text-sm text-text-muted">
                  Manage and track your shipment invoices
                </p>
              </div>
              <Link href="/dashboard/invoices/create">
                <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all">
                  <Plus className="w-5 h-5" />
                  Create Invoice
                </button>
              </Link>
            </div>

            {/* Invoice List */}
            {invoices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card p-12 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-rlusd-primary/10 flex items-center justify-center mx-auto mb-6 border border-rlusd-primary/30">
                  <FileText className="w-10 h-10 text-rlusd-glow" />
                </div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                  No invoices yet
                </h3>
                <p className="text-text-muted mb-6">
                  Create your first freight invoice to get started
                </p>
                <Link href="/dashboard/invoices/create">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all">
                    <Plus className="w-5 h-5" />
                    Create Invoice
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="card p-6 hover:border-rlusd-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-display text-lg font-semibold text-text-primary">
                            Invoice #{invoice.invoiceNumber}
                          </h3>

                          {/* Voyage Badge */}
                          {invoice.voyageId && invoice.voyageNumber && (
                            <Link
                              href={`/dashboard/voyages/${invoice.voyageId}`}
                              className="px-2 py-1 rounded bg-accent-sky/20 border border-accent-sky/30 text-xs font-mono text-accent-sky hover:bg-accent-sky/30 transition-colors flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3" />
                              {invoice.voyageNumber}
                            </Link>
                          )}

                          {/* Payment Status */}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30'
                              : 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                          }`}>
                            {invoice.status === 'paid' ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending Payment
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <span>{invoice.shipowner.vessel}</span>
                          {invoice.voyageNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{invoice.voyageNumber}</span>
                            </>
                          )}
                          {invoice.milestoneReferences && invoice.milestoneReferences.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-xs">
                                <Target className="w-3 h-3" />
                                {invoice.milestoneReferences.filter((m: any) => m.milestoneStatus === 'verified').length}/{invoice.milestoneReferences.length} verified
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-rlusd-glow">
                          ${invoice.grandTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Parties */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/5">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">From</p>
                        <p className="text-sm font-medium text-text-primary">{invoice.shipowner.name}</p>
                        <p className="text-xs text-text-muted">{invoice.shipowner.contact}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">To</p>
                        <p className="text-sm font-medium text-text-primary">{invoice.charterer.name}</p>
                        <p className="text-xs text-text-muted">{invoice.charterer.contact}</p>
                      </div>
                    </div>

                    {/* Payment Link */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-3 rounded-lg bg-maritime-slate/20 border border-white/5">
                        <p className="text-xs text-text-muted mb-1">Payment Link</p>
                        <p className="text-sm font-mono text-text-primary truncate">
                          {window.location.origin}/dashboard/invoices/pay/{invoice.id}
                        </p>
                      </div>
                      <button
                        onClick={() => copyPaymentLink(invoice.id)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          copiedId === invoice.id
                            ? 'bg-rlusd-primary/20 text-rlusd-glow border border-rlusd-primary/30'
                            : 'bg-maritime-slate/30 text-text-primary border border-white/10 hover:bg-maritime-slate/50'
                        }`}
                      >
                        {copiedId === invoice.id ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Copied!
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
