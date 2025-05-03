'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ship,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  ArrowRight,
  Clock,
  Target,
  Navigation,
  Eye,
} from 'lucide-react';
import { Voyage, STORAGE_KEYS } from '@/types/voyage';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    // Debug: Log what we're looking for
    console.log('🔍 Looking for invoice:', invoiceId);
    console.log('🔍 Checking storage keys:', {
      voyageInvoice: STORAGE_KEYS.voyageInvoice(invoiceId),
      directKey: invoiceId
    });

    // Try loading from voyage invoice storage first
    let data = localStorage.getItem(STORAGE_KEYS.voyageInvoice(invoiceId));
    console.log('📦 Voyage invoice data:', data ? 'Found' : 'Not found');

    // Fallback to old invoice storage
    if (!data) {
      data = localStorage.getItem(invoiceId);
      console.log('📦 Direct invoice data:', data ? 'Found' : 'Not found');
    }

    if (data) {
      const invoiceData = JSON.parse(data);
      console.log('✅ Invoice loaded:', invoiceData);
      setInvoice(invoiceData);
      setPaymentComplete(invoiceData.status === 'paid');

      // Load linked voyage if exists
      if (invoiceData.voyageId) {
        const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(invoiceData.voyageId));
        if (voyageData) {
          setVoyage(JSON.parse(voyageData));
        }
      }
    } else {
      console.log('❌ Invoice not found in localStorage');
      // Debug: List all localStorage keys
      console.log('📋 Available localStorage keys:', Object.keys(localStorage));
    }
    setIsLoading(false);

    // Check if wallet is connected
    const address = localStorage.getItem('walletAddress');
    if (address) {
      setWalletConnected(true);
      setWalletAddress(address);
    }
  }, [invoiceId]);

  const handlePayment = async () => {
    setIsPaying(true);

    // Simulate payment processing delay
    setTimeout(() => {
      // Update invoice status to paid
      if (invoice) {
        const updatedInvoice = {
          ...invoice,
          status: 'paid',
          paidAt: new Date().toISOString(),
          paidBy: walletAddress || 'Simulated Payment',
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
        };

        // Save to the same storage key that was used to load it
        const storageKey = invoice.voyageId ? STORAGE_KEYS.voyageInvoice(invoiceId) : invoiceId;

        console.log('💳 Processing payment:', {
          invoiceId,
          storageKey,
          hasVoyage: !!invoice.voyageId,
          status: 'paid'
        });

        localStorage.setItem(storageKey, JSON.stringify(updatedInvoice));

        // Verify it was saved
        const saved = localStorage.getItem(storageKey);
        console.log('✅ Payment saved verification:', saved ? 'Success' : 'Failed');

        setInvoice(updatedInvoice);
        setPaymentComplete(true);
        setIsPaying(false);
      }
    }, 2000);
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-rlusd-glow" />;
      case 'awaiting_verification':
        return <Clock className="w-4 h-4 text-accent-amber" />;
      case 'in_progress':
        return <Navigation className="w-4 h-4 text-accent-sky animate-pulse" />;
      default:
        return <Target className="w-4 h-4 text-text-muted" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-rlusd-glow animate-spin" />
          <p className="text-text-muted">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
            Invoice Not Found
          </h2>
          <p className="text-text-muted mb-6">
            The invoice you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all"
          >
            Go to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-maritime-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
                <FileText className="w-5 h-5 text-rlusd-glow" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-text-primary">
                  Payment Portal
                </h1>
                <p className="text-xs text-text-muted">Secure blockchain payment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {paymentComplete ? (
            /* Payment Success */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="card p-12 text-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-rlusd-primary/10 flex items-center justify-center mx-auto mb-6 border border-rlusd-primary/30">
                <CheckCircle2 className="w-12 h-12 text-rlusd-glow" />
              </div>
              <h2 className="font-display text-3xl font-bold text-text-primary mb-3">
                Payment Successful!
              </h2>
              <p className="text-text-muted mb-8 text-lg">
                Your payment of <span className="font-mono font-bold text-rlusd-glow">${invoice.grandTotal.toLocaleString()}</span> has been processed
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-maritime-slate/30 border border-white/5 text-left">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Transaction ID</p>
                  <p className="font-mono text-sm text-text-primary break-all">
                    {invoiceId}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-maritime-slate/30 border border-white/5 text-left">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Paid On</p>
                  <p className="text-sm text-text-primary">
                    {new Date(invoice.paidAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-rlusd-primary/10 border border-rlusd-primary/30 mb-8">
                <Shield className="w-5 h-5 text-rlusd-glow shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Direct Payment to Shipowner</p>
                  <p className="text-xs text-text-muted">Funds transferred directly via XRPL blockchain</p>
                </div>
              </div>

              {voyage && (
                <div className="mb-8 p-4 rounded-xl bg-maritime-slate/30 border border-white/5 text-left">
                  <Link href={`/dashboard/voyages/${voyage.id}`} className="flex items-center justify-between hover:bg-maritime-slate/50 -m-4 p-4 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <Ship className="w-5 h-5 text-accent-sky" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">View Voyage Progress</p>
                        <p className="text-xs text-text-muted font-mono">{voyage.voyageNumber} • {voyage.routeName}</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-text-muted" />
                  </Link>
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard/invoices')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all"
              >
                Return to Invoices
              </button>
            </motion.div>
          ) : (
            /* Payment Form */
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Invoice Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card p-6">
                  <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                    Invoice Details
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Invoice Number</p>
                      <p className="font-mono text-lg font-bold text-text-primary">{invoice.invoiceNumber}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">From</p>
                      <p className="text-sm font-semibold text-text-primary mb-1">{invoice.shipowner.name}</p>
                      <p className="text-xs text-text-muted mb-2">{invoice.shipowner.address}</p>
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <p className="text-xs text-text-muted">
                          Vessel: <span className="text-text-primary font-mono">{invoice.shipowner.vessel}</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          Voyage: <span className="text-text-primary font-mono">{invoice.shipowner.voyageNo}</span>
                        </p>
                        {invoice.shipowner.did && (
                          <p className="text-xs text-text-muted">
                            DID: <span className="text-accent-sky font-mono text-[10px] break-all">{invoice.shipowner.did}</span>
                          </p>
                        )}
                        {invoice.shipowner.walletAddress && (
                          <p className="text-xs text-text-muted">
                            Wallet: <span className="text-rlusd-glow font-mono text-[10px] break-all">{invoice.shipowner.walletAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">To</p>
                      <p className="text-sm font-semibold text-text-primary mb-1">{invoice.charterer.name}</p>
                      <p className="text-xs text-text-muted mb-2">{invoice.charterer.address}</p>
                      {(invoice.charterer.did || invoice.charterer.walletAddress) && (
                        <div className="pt-2 border-t border-white/5 space-y-1 mt-2">
                          {invoice.charterer.did && (
                            <p className="text-xs text-text-muted">
                              DID: <span className="text-accent-sky font-mono text-[10px] break-all">{invoice.charterer.did}</span>
                            </p>
                          )}
                          {invoice.charterer.walletAddress && (
                            <p className="text-xs text-text-muted">
                              Wallet: <span className="text-rlusd-glow font-mono text-[10px] break-all">{invoice.charterer.walletAddress}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Voyage Context */}
                    {voyage && (
                      <div className="p-4 rounded-lg bg-accent-sky/10 border border-accent-sky/30">
                        <Link href={`/dashboard/voyages/${voyage.id}`} className="group">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-accent-sky" />
                              <p className="text-xs font-mono text-accent-sky uppercase tracking-wider">Linked Voyage</p>
                            </div>
                            <Eye className="w-4 h-4 text-accent-sky opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="font-mono text-sm text-text-primary mb-1">{voyage.voyageNumber}</p>
                          <p className="text-xs text-text-muted">{voyage.routeName}</p>
                          <div className="mt-2 pt-2 border-t border-accent-sky/20">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-text-muted">Progress:</span>
                              <span className="font-mono font-bold text-accent-sky">{voyage.currentProgress}%</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Milestone Tracking */}
                    {voyage && invoice.milestoneReferences && invoice.milestoneReferences.length > 0 && (
                      <div className="p-4 rounded-lg bg-maritime-steel/30 border border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-rlusd-glow" />
                          <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Milestone Tracking</p>
                        </div>
                        <p className="text-xs text-text-muted mb-3">
                          Platform verification provides transparency for both parties
                        </p>
                        <div className="space-y-2">
                          {invoice.milestoneReferences.slice(0, 4).map((ref: any) => (
                            <div key={ref.milestoneId} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getMilestoneStatusIcon(ref.milestoneStatus)}
                                <span className="text-xs text-text-primary truncate">{ref.milestoneName}</span>
                              </div>
                              <span className={`text-xs font-mono uppercase ${
                                ref.milestoneStatus === 'verified' ? 'text-rlusd-glow' :
                                ref.milestoneStatus === 'awaiting_verification' ? 'text-accent-amber' :
                                ref.milestoneStatus === 'in_progress' ? 'text-accent-sky' :
                                'text-text-muted'
                              }`}>
                                {ref.milestoneStatus === 'verified' ? '✓' :
                                 ref.milestoneStatus === 'awaiting_verification' ? '⊙' : '○'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {invoice.milestoneReferences.length > 4 && (
                          <Link href={`/dashboard/voyages/${voyage.id}`} className="text-xs text-accent-sky hover:text-accent-sky/80 mt-2 inline-block">
                            View all {invoice.milestoneReferences.length} milestones →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Transaction Details</h3>
                    <div className="space-y-2">
                      {invoice.lineItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-text-muted">{item.description}</span>
                          <span className="font-mono text-text-primary">${item.total.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                        <span className="text-text-muted">Subtotal</span>
                        <span className="font-mono text-text-primary">${invoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">{invoice.discountLabel}</span>
                        <span className="font-mono text-accent-sky">-${invoice.discount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/5">
                        <span className="font-semibold text-text-primary">TOTAL DUE</span>
                        <span className="font-mono font-bold text-2xl text-rlusd-glow">${invoice.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="card p-6">
                  <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                    Payment Method
                  </h2>

                  {/* RLUSD Payment Option */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rlusd-primary/10 to-rlusd-primary/5 border-2 border-rlusd-primary/30 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-rlusd-primary/20 flex items-center justify-center">
                        <Ship className="w-6 h-6 text-rlusd-glow" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">RLUSD Payment</h3>
                        <p className="text-xs text-text-muted">Pay with Ripple USD</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-rlusd-primary flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-rlusd-primary">
                      <Lock className="w-3 h-3" />
                      Instant settlement • 1% discount applied
                    </div>
                  </div>

                  {/* Simulated Payment Notice */}
                  <div className="p-4 rounded-lg bg-accent-sky/10 border border-accent-sky/30 mb-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent-sky" />
                      <p className="text-sm text-accent-sky font-medium">Simulated Payment Mode</p>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      This is a demo environment. Payment will be processed immediately.
                    </p>
                  </div>

                  {/* Wallet Connection Status */}
                  {walletConnected && (
                    <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-text-muted uppercase tracking-wider">Connected Wallet</p>
                        <div className="px-2 py-1 rounded bg-rlusd-primary/20 border border-rlusd-primary/30">
                          <CheckCircle2 className="w-3 h-3 text-rlusd-glow" />
                        </div>
                      </div>
                      <p className="font-mono text-sm text-text-primary">
                        {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
                      </p>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-accent-sky shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-1">Direct Payment to Shipowner</h4>
                        <p className="text-xs text-text-muted leading-relaxed">
                          Your payment will be transferred directly to the shipowner via XRPL blockchain. {voyage && 'Voyage progress and milestone verification provide transparency for both parties.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all ${
                      !isPaying
                        ? 'bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white hover:shadow-glow-md'
                        : 'bg-maritime-slate/30 text-text-muted cursor-not-allowed'
                    }`}
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        Pay ${invoice.grandTotal.toLocaleString()} RLUSD
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-text-muted mt-4">
                    By proceeding, you agree to the terms of the charter party agreement
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
