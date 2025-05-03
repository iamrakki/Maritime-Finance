'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Ship,
  FileText,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  FileCheck,
  AlertCircle,
  Split,
  FileStack,
} from 'lucide-react';
import { Voyage, VoyageInvoice, STORAGE_KEYS } from '@/types/voyage';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voyageId = searchParams.get('voyageId');

  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [invoiceType, setInvoiceType] = useState<'single' | 'multiple' | null>(null);

  // Load voyage if voyageId is provided
  useEffect(() => {
    if (voyageId) {
      const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
      if (voyageData) {
        setVoyage(JSON.parse(voyageData));
      }
    }
  }, [voyageId]);

  // Simulated OCR processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);

    // Simulate OCR processing delay
    setTimeout(() => {
      // Mock OCR extracted data - use voyage context if available
      const baseData = {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: 'Upon Receipt',
        lineItems: [
          { description: 'Lumpsum Freight', quantity: 1, rate: 45000, total: 45000 },
          { description: 'Demurrage Fees', quantity: 2, rate: 1500, total: 3000 },
          { description: 'Bunker Adjustment Factor (BAF)', quantity: 1, rate: 2200, total: 2200 }
        ],
        subtotal: 50200,
        discount: 502,
        discountLabel: 'RLUSD Payment Discount (1%)',
        grandTotal: 49698
      };

      if (voyage) {
        // Auto-fill from voyage context
        setOcrData({
          ...baseData,
          shipowner: {
            name: voyage.shipownerName,
            company: voyage.shipownerCompany || '',
            address: '',
            contact: '',
            vessel: voyage.vesselName,
            voyageNo: voyage.voyageNumber,
            did: `did:xrpl:1:${Math.random().toString(36).substring(2, 15)}`,
            walletAddress: `r${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`
          },
          charterer: {
            name: voyage.chartererName,
            company: voyage.chartererCompany || '',
            address: '',
            contact: '',
            did: `did:xrpl:1:${Math.random().toString(36).substring(2, 15)}`,
            walletAddress: `r${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`
          },
          route: voyage.routeName,
          vessel: voyage.vesselName,
          voyageNumber: voyage.voyageNumber,
        });
      } else {
        // Standalone invoice
        setOcrData({
          ...baseData,
          shipowner: {
            name: 'Blue Horizon Shipping Ltd.',
            address: '12 Maritime Plaza, Singapore',
            contact: 'operations@bluehorizon.com',
            vessel: 'MV Ocean Titan',
            voyageNo: 'OT-202B',
            did: 'did:xrpl:1:bluehorizon7x9k2m',
            walletAddress: 'rN7n7otQDd6FczFgLdWqHfcH4rrFLkYUZL'
          },
          charterer: {
            name: 'Global Commodities Corp.',
            address: '4500 Park Avenue, New York, NY',
            contact: 'accounts@globalcomm.com',
            did: 'did:xrpl:1:globalcomm5p8w3n',
            walletAddress: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'
          },
        });
      }
      setIsProcessing(false);
    }, 2000);
  };

  const handleCreateInvoice = (type: 'single' | 'multiple') => {
    if (!ocrData) return;

    if (type === 'single') {
      // Create single invoice with milestone references
      const invoiceId = `inv-${Date.now()}`;
      const voyageInvoice: any = {
        ...ocrData,
        id: invoiceId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentLink: `/dashboard/invoices/pay/${invoiceId}`,
        voyageId: voyage?.id,
        voyageNumber: voyage?.voyageNumber,
        milestoneReferences: voyage?.milestones.map(m => ({
          milestoneId: m.id,
          milestoneName: m.name,
          milestoneStatus: m.status,
          amount: 0, // Distribute grandTotal across milestones if needed
          description: `Milestone: ${m.name}`
        }))
      };

      // Save with the appropriate key based on whether it's linked to a voyage
      const storageKey = voyage ? STORAGE_KEYS.voyageInvoice(invoiceId) : invoiceId;

      console.log('💾 Saving invoice:', {
        invoiceId,
        storageKey,
        hasVoyage: !!voyage,
        invoice: voyageInvoice
      });

      localStorage.setItem(storageKey, JSON.stringify(voyageInvoice));

      // Verify it was saved
      const saved = localStorage.getItem(storageKey);
      console.log('✅ Invoice saved verification:', saved ? 'Success' : 'Failed');

      // Update voyage with invoice reference
      if (voyage) {
        voyage.invoiceIds.push(invoiceId);
        localStorage.setItem(STORAGE_KEYS.voyage(voyage.id), JSON.stringify(voyage));
      }

      router.push('/dashboard/invoices');
    } else {
      // Create multiple invoices (one per milestone)
      const verifiedMilestones = voyage?.milestones.filter(m => m.requiresVerification) || [];
      const amountPerMilestone = Math.floor(ocrData.grandTotal / verifiedMilestones.length);

      verifiedMilestones.forEach((milestone, index) => {
        const invoiceId = `inv-${Date.now()}-${index}`;
        const isLast = index === verifiedMilestones.length - 1;
        const amount = isLast
          ? ocrData.grandTotal - (amountPerMilestone * (verifiedMilestones.length - 1))
          : amountPerMilestone;

        const voyageInvoice: any = {
          ...ocrData,
          id: invoiceId,
          invoiceNumber: `${ocrData.invoiceNumber}-M${index + 1}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          paymentLink: `/dashboard/invoices/pay/${invoiceId}`,
          voyageId: voyage?.id,
          voyageNumber: voyage?.voyageNumber,
          lineItems: [
            {
              description: `Freight - ${milestone.name}`,
              quantity: 1,
              rate: amount,
              total: amount,
              milestoneId: milestone.id
            }
          ],
          subtotal: amount,
          discount: 0,
          grandTotal: amount,
          milestoneReferences: [{
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            milestoneStatus: milestone.status,
            amount: amount,
            description: `Payment for ${milestone.name}`
          }]
        };

        localStorage.setItem(STORAGE_KEYS.voyageInvoice(invoiceId), JSON.stringify(voyageInvoice));

        // Update voyage with invoice reference
        if (voyage) {
          voyage.invoiceIds.push(invoiceId);
        }
      });

      if (voyage) {
        localStorage.setItem(STORAGE_KEYS.voyage(voyage.id), JSON.stringify(voyage));
      }

      router.push('/dashboard/invoices');
    }
  };

  return (
    <div className="min-h-screen bg-maritime-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={voyage ? `/dashboard/voyages/${voyage.id}` : "/dashboard/invoices"}>
                <button className="p-2 hover:bg-maritime-slate/30 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-text-muted" />
                </button>
              </Link>
              <div>
                <h1 className="font-display text-xl font-semibold text-text-primary">
                  {voyage ? 'Create Invoice from Voyage' : 'Create Invoice'}
                </h1>
                <p className="text-xs text-text-muted">
                  {voyage ? `For ${voyage.vesselName} - ${voyage.voyageNumber}` : 'Upload freight invoice document'}
                </p>
              </div>
            </div>
            {voyage && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30">
                <Ship className="w-4 h-4 text-rlusd-glow" />
                <span className="text-sm font-mono text-text-primary">{voyage.routeName}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Upload Section */}
            {!ocrData && (
              <div className="card p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-rlusd-primary/10 flex items-center justify-center mx-auto mb-4 border border-rlusd-primary/30">
                    <Upload className="w-8 h-8 text-rlusd-glow" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                    Upload Freight Invoice
                  </h2>
                  <p className="text-text-muted">
                    Upload your invoice document for automatic OCR processing
                  </p>
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isProcessing
                      ? 'border-rlusd-primary/50 bg-rlusd-primary/5'
                      : 'border-white/10 hover:border-rlusd-primary/50 hover:bg-rlusd-primary/5'
                  }`}>
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-rlusd-glow animate-spin" />
                        <div>
                          <p className="text-text-primary font-medium mb-1">Processing Invoice...</p>
                          <p className="text-sm text-text-muted">Extracting data from {uploadedFile?.name}</p>
                        </div>
                      </div>
                    ) : uploadedFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <FileCheck className="w-12 h-12 text-rlusd-glow" />
                        <p className="text-text-primary font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-text-muted">Click to upload a different file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-text-muted" />
                        <p className="text-text-primary font-medium">Click to upload invoice</p>
                        <p className="text-sm text-text-muted">PDF, JPG, or PNG (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* OCR Results */}
            {ocrData && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rlusd-primary/10 border border-rlusd-primary/30">
                  <CheckCircle2 className="w-5 h-5 text-rlusd-glow shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Invoice data extracted successfully</p>
                    <p className="text-xs text-text-muted">Review the details below and create the invoice</p>
                  </div>
                </div>

                {/* Invoice Preview */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-text-primary">Freight Invoice</h2>
                      <p className="text-sm text-text-muted mt-1">Invoice #{ocrData.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Date</p>
                      <p className="text-sm font-mono text-text-primary">{ocrData.date}</p>
                      <p className="text-xs text-text-muted mt-2">Due Date</p>
                      <p className="text-sm font-mono text-text-primary">{ocrData.dueDate}</p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">From (Shipowner)</p>
                      <p className="font-semibold text-text-primary mb-1">{ocrData.shipowner.name}</p>
                      <p className="text-sm text-text-muted mb-1">{ocrData.shipowner.address}</p>
                      <p className="text-sm text-text-muted">{ocrData.shipowner.contact}</p>
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                        <p className="text-xs text-text-muted">Vessel: <span className="text-text-primary font-mono">{ocrData.shipowner.vessel}</span></p>
                        <p className="text-xs text-text-muted">Voyage: <span className="text-text-primary font-mono">{ocrData.shipowner.voyageNo}</span></p>
                        <p className="text-xs text-text-muted">DID: <span className="text-accent-sky font-mono text-[10px]">{ocrData.shipowner.did}</span></p>
                        <p className="text-xs text-text-muted">Wallet: <span className="text-rlusd-glow font-mono text-[10px]">{ocrData.shipowner.walletAddress}</span></p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">To (Charterer)</p>
                      <p className="font-semibold text-text-primary mb-1">{ocrData.charterer.name}</p>
                      <p className="text-sm text-text-muted mb-1">{ocrData.charterer.address}</p>
                      <p className="text-sm text-text-muted">{ocrData.charterer.contact}</p>
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                        <p className="text-xs text-text-muted">DID: <span className="text-accent-sky font-mono text-[10px]">{ocrData.charterer.did}</span></p>
                        <p className="text-xs text-text-muted">Wallet: <span className="text-rlusd-glow font-mono text-[10px]">{ocrData.charterer.walletAddress}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="mb-6">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Transaction Details</p>
                    <div className="overflow-hidden rounded-lg border border-white/5">
                      <table className="w-full">
                        <thead className="bg-maritime-slate/30">
                          <tr>
                            <th className="text-left text-xs text-text-muted uppercase tracking-wider p-3">Description</th>
                            <th className="text-right text-xs text-text-muted uppercase tracking-wider p-3">Qty</th>
                            <th className="text-right text-xs text-text-muted uppercase tracking-wider p-3">Rate</th>
                            <th className="text-right text-xs text-text-muted uppercase tracking-wider p-3">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {ocrData.lineItems.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="p-3 text-sm text-text-primary">{item.description}</td>
                              <td className="p-3 text-sm text-text-primary text-right font-mono">{item.quantity}</td>
                              <td className="p-3 text-sm text-text-primary text-right font-mono">${item.rate.toLocaleString()}</td>
                              <td className="p-3 text-sm text-text-primary text-right font-mono">${item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 p-4 rounded-lg bg-maritime-slate/20 border border-white/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Subtotal</span>
                      <span className="font-mono text-text-primary">${ocrData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">{ocrData.discountLabel}</span>
                      <span className="font-mono text-accent-sky">-${ocrData.discount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-white/5">
                      <span className="font-semibold text-text-primary">GRAND TOTAL DUE</span>
                      <span className="font-mono font-bold text-2xl text-rlusd-glow">${ocrData.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Type Selection (for voyage-linked invoices) */}
                {voyage && !invoiceType && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-muted mb-4">Choose how to structure the invoice:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setInvoiceType('single')}
                          className="p-6 rounded-xl border-2 border-white/10 hover:border-rlusd-primary/50 hover:bg-rlusd-primary/5 transition-all group text-left"
                        >
                          <FileText className="w-8 h-8 text-rlusd-glow mb-3" />
                          <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                            Single Invoice
                          </h3>
                          <p className="text-sm text-text-muted">
                            One invoice with all line items and milestone references for transparency
                          </p>
                        </button>

                        <button
                          onClick={() => setInvoiceType('multiple')}
                          className="p-6 rounded-xl border-2 border-white/10 hover:border-rlusd-primary/50 hover:bg-rlusd-primary/5 transition-all group text-left"
                        >
                          <FileStack className="w-8 h-8 text-accent-sky mb-3" />
                          <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                            Multiple Invoices
                          </h3>
                          <p className="text-sm text-text-muted">
                            Separate invoice for each milestone ({voyage.milestones.filter(m => m.requiresVerification).length} invoices)
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {(!voyage || invoiceType) && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setOcrData(null);
                        setUploadedFile(null);
                        setInvoiceType(null);
                      }}
                      className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-text-primary font-medium hover:bg-maritime-slate/30 transition-all"
                    >
                      {voyage && invoiceType ? 'Back to Type Selection' : 'Upload Different Invoice'}
                    </button>
                    <button
                      onClick={() => voyage ? handleCreateInvoice(invoiceType!) : handleCreateInvoice('single')}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white font-medium hover:shadow-glow-md transition-all"
                    >
                      {voyage && invoiceType === 'multiple'
                        ? `Create ${voyage.milestones.filter(m => m.requiresVerification).length} Invoices`
                        : 'Create Invoice & Get Payment Link'
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
