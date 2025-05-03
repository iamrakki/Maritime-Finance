'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Ship,
  MapPin,
  Upload,
  FileText,
  CheckCircle2,
  Shield,
  Clock,
  Navigation,
  Image as ImageIcon,
} from 'lucide-react';
import { Milestone, Voyage, Attestation, STORAGE_KEYS } from '@/types/voyage';

export default function VerifyMilestonePage() {
  const params = useParams();
  const milestoneId = params.milestoneId as string;

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [verifierName, setVerifierName] = useState('');
  const [verifierRole, setVerifierRole] = useState('port_authority');
  const [verifierOrg, setVerifierOrg] = useState('');
  const [notes, setNotes] = useState('');
  const [aisFile, setAisFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  // Processing state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [attestationId, setAttestationId] = useState('');

  useEffect(() => {
    loadMilestone();
  }, [milestoneId]);

  const loadMilestone = () => {
    const milestoneData = localStorage.getItem(STORAGE_KEYS.milestone(milestoneId));
    if (milestoneData) {
      const m = JSON.parse(milestoneData) as Milestone;
      setMilestone(m);

      // Load associated voyage
      const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(m.voyageId));
      if (voyageData) {
        setVoyage(JSON.parse(voyageData));
      }
    }
    setLoading(false);
  };

  const handleAisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAisFile(e.target.files[0]);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmitVerification = async () => {
    if (!milestone || !voyage) return;

    setIsVerifying(true);

    // Simulate 3-second platform verification
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Create attestation
    const attestation: Attestation = {
      id: `attestation-${Date.now()}`,
      milestoneId: milestone.id,
      voyageId: milestone.voyageId,
      verifierId: `verifier-${Date.now()}`,
      verifierName,
      verifierType: verifierRole as any,
      verifierOrganization: verifierOrg,
      timestamp: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      evidenceType: aisFile ? 'ais_data' : 'document',
      aisData: voyage.currentAIS || {
        position: milestone.coordinates || [0, 0],
        speed: 12,
        heading: 90,
        timestamp: new Date().toISOString(),
      },
      documents: documents.map((doc, i) => ({
        id: `doc-${i}-${Date.now()}`,
        name: doc.name,
        type: doc.type,
        uploadedAt: new Date().toISOString(),
      })),
      notes,
      platformVerified: true,
      platformTimestamp: new Date().toISOString(),
      signedHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save attestation
    localStorage.setItem(STORAGE_KEYS.attestation(attestation.id), JSON.stringify(attestation));

    // Update milestone
    const updatedMilestone = {
      ...milestone,
      status: 'verified' as const,
      attestationId: attestation.id,
      verifiedAt: attestation.verifiedAt,
      verifiedBy: verifierName,
    };
    localStorage.setItem(STORAGE_KEYS.milestone(milestone.id), JSON.stringify(updatedMilestone));

    // Update voyage
    const updatedVoyage = {
      ...voyage,
      milestones: voyage.milestones.map((m) =>
        m.id === milestone.id ? updatedMilestone : m
      ),
      milestonesCompleted: voyage.milestonesCompleted + 1,
    };
    localStorage.setItem(STORAGE_KEYS.voyage(voyage.id), JSON.stringify(updatedVoyage));

    setAttestationId(attestation.id);
    setIsVerifying(false);
    setVerificationComplete(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <p className="font-mono text-text-muted">Loading milestone...</p>
      </div>
    );
  }

  if (!milestone || !voyage) {
    return (
      <div className="min-h-screen bg-maritime-dark flex items-center justify-center">
        <p className="font-mono text-text-muted">Milestone not found</p>
      </div>
    );
  }

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

      <div className="relative z-10 px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!verificationComplete ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex w-16 h-16 rounded-xl bg-gradient-to-br from-rlusd-primary/40 to-rlusd-primary/10 items-center justify-center border border-rlusd-primary/50 mb-4">
                    <Shield className="w-8 h-8 text-rlusd-glow" />
                  </div>
                  <h1 className="font-display text-4xl font-bold text-text-primary mb-2 uppercase tracking-tight">
                    Milestone Verification
                  </h1>
                  <p className="text-text-muted font-mono">Platform Attestation Submission</p>
                </div>

                <div className="grid grid-cols-5 gap-6">
                  {/* Left: Milestone Details (2/5) */}
                  <div className="col-span-2 space-y-6">
                    {/* Voyage Info */}
                    <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Ship className="w-5 h-5 text-accent-sky" />
                        <h3 className="font-display text-lg font-bold text-text-primary uppercase">Voyage Info</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-mono text-text-muted uppercase mb-1">Vessel</p>
                          <p className="font-mono text-sm text-text-primary">{voyage.vesselName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-mono text-text-muted uppercase mb-1">Voyage Number</p>
                          <p className="font-mono text-sm text-text-primary">{voyage.voyageNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-mono text-text-muted uppercase mb-1">Route</p>
                          <p className="font-mono text-sm text-text-primary">{voyage.routeName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Details */}
                    <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Navigation className="w-5 h-5 text-rlusd-glow" />
                        <h3 className="font-display text-lg font-bold text-text-primary uppercase">Milestone</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-mono text-text-muted uppercase mb-1">Name</p>
                          <p className="font-display text-lg text-text-primary">{milestone.name}</p>
                        </div>

                        {milestone.description && (
                          <div>
                            <p className="text-xs font-mono text-text-muted uppercase mb-1">Description</p>
                            <p className="text-sm text-text-secondary">{milestone.description}</p>
                          </div>
                        )}

                        {milestone.coordinates && (
                          <div>
                            <p className="text-xs font-mono text-text-muted uppercase mb-1">Location</p>
                            <p className="font-mono text-sm text-text-primary">
                              {milestone.coordinates[0].toFixed(4)}°N, {milestone.coordinates[1].toFixed(4)}°E
                            </p>
                          </div>
                        )}

                        {milestone.progressPercentage !== undefined && (
                          <div>
                            <p className="text-xs font-mono text-text-muted uppercase mb-1">Progress Point</p>
                            <p className="font-mono text-sm text-text-primary">{milestone.progressPercentage}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current AIS Data (if available) */}
                    {voyage.currentAIS && (
                      <div className="bg-gradient-to-br from-accent-sky/10 to-accent-sky/5 backdrop-blur-xl rounded-xl border border-accent-sky/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="w-5 h-5 text-accent-sky" />
                          <h3 className="font-display text-lg font-bold text-text-primary uppercase">Current AIS</h3>
                        </div>

                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-muted">Position:</span>
                            <span className="text-text-primary">
                              {voyage.currentAIS.position[0].toFixed(4)}°N, {voyage.currentAIS.position[1].toFixed(4)}°E
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Speed:</span>
                            <span className="text-text-primary">{voyage.currentAIS.speed.toFixed(1)} knots</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Heading:</span>
                            <span className="text-text-primary">{voyage.currentAIS.heading}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Timestamp:</span>
                            <span className="text-text-primary text-xs">
                              {new Date(voyage.currentAIS.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Verification Form (3/5) */}
                  <div className="col-span-3">
                    <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                      <h2 className="font-display text-2xl font-bold text-text-primary mb-6 uppercase">
                        Submit Verification
                      </h2>

                      <div className="space-y-6">
                        {/* Verifier Details */}
                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            value={verifierName}
                            onChange={(e) => setVerifierName(e.target.value)}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                            placeholder="John Smith"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-mono text-text-muted uppercase mb-2">Role *</label>
                            <select
                              value={verifierRole}
                              onChange={(e) => setVerifierRole(e.target.value)}
                              className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                            >
                              <option value="port_authority">Port Authority</option>
                              <option value="inspector">Inspector</option>
                              <option value="agent">Agent</option>
                              <option value="automated">Automated System</option>
                              <option value="custom">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                              Organization
                            </label>
                            <input
                              type="text"
                              value={verifierOrg}
                              onChange={(e) => setVerifierOrg(e.target.value)}
                              className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                              placeholder="Singapore Port Authority"
                            />
                          </div>
                        </div>

                        {/* AIS Data Upload */}
                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                            AIS Data Snapshot
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleAisFileChange}
                              className="hidden"
                              id="ais-upload"
                            />
                            <label
                              htmlFor="ais-upload"
                              className="flex items-center justify-center gap-3 w-full px-4 py-6 bg-maritime-dark/50 border-2 border-dashed border-white/10 hover:border-accent-sky/40 rounded-lg cursor-pointer transition-all group"
                            >
                              <ImageIcon className="w-5 h-5 text-accent-sky" />
                              <span className="font-mono text-sm text-text-muted group-hover:text-accent-sky transition-colors">
                                {aisFile ? aisFile.name : 'Upload AIS Screenshot or Data File'}
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Supporting Documents */}
                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                            Supporting Documents
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,image/*"
                              onChange={handleDocumentChange}
                              className="hidden"
                              id="doc-upload"
                            />
                            <label
                              htmlFor="doc-upload"
                              className="flex items-center justify-center gap-3 w-full px-4 py-6 bg-maritime-dark/50 border-2 border-dashed border-white/10 hover:border-rlusd-primary/40 rounded-lg cursor-pointer transition-all group"
                            >
                              <Upload className="w-5 h-5 text-rlusd-glow" />
                              <span className="font-mono text-sm text-text-muted group-hover:text-rlusd-glow transition-colors">
                                {documents.length > 0
                                  ? `${documents.length} file${documents.length > 1 ? 's' : ''} selected`
                                  : 'Upload Port Certificates, Photos, etc.'}
                              </span>
                            </label>
                          </div>
                          {documents.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {documents.map((doc, i) => (
                                <p key={i} className="text-xs font-mono text-text-muted flex items-center gap-2">
                                  <FileText className="w-3 h-3" />
                                  {doc.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                            Notes / Comments
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono text-sm focus:border-rlusd-primary focus:outline-none transition-colors resize-none"
                            placeholder="Add any observations or notes about this milestone verification..."
                          />
                        </div>

                        {/* Warning */}
                        <div className="p-4 bg-accent-amber/10 border border-accent-amber/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
                            <div>
                              <p className="font-mono text-sm text-accent-amber font-bold mb-1">Important Notice</p>
                              <p className="text-xs text-text-muted font-mono">
                                This verification will be recorded permanently on the platform. By submitting, you
                                confirm the accuracy of the provided information and evidence.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSubmitVerification}
                          disabled={!verifierName || isVerifying}
                          className={`w-full py-4 rounded-lg font-mono uppercase font-bold text-lg transition-all ${
                            !verifierName || isVerifying
                              ? 'bg-maritime-slate/40 text-text-muted cursor-not-allowed'
                              : 'bg-gradient-to-r from-rlusd-primary to-rlusd-glow text-maritime-dark'
                          }`}
                        >
                          {isVerifying ? (
                            <span className="flex items-center justify-center gap-3">
                              <Clock className="w-5 h-5 animate-spin" />
                              Platform Verifying...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-3">
                              <Shield className="w-5 h-5" />
                              Submit Verification
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex w-24 h-24 rounded-2xl bg-gradient-to-br from-rlusd-primary to-rlusd-glow items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="w-12 h-12 text-maritime-dark" />
                  </motion.div>

                  <h2 className="font-display text-3xl font-bold text-text-primary mb-3 uppercase">
                    Verification Successful!
                  </h2>
                  <p className="text-text-muted font-mono mb-8">Milestone verified by platform</p>

                  <div className="bg-maritime-dark/50 rounded-xl border border-white/10 p-6 mb-8">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-text-muted uppercase">Attestation ID</span>
                        <span className="font-mono text-sm text-rlusd-glow">{attestationId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-text-muted uppercase">Timestamp</span>
                        <span className="font-mono text-sm text-text-primary">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-text-muted uppercase">Verifier</span>
                        <span className="font-mono text-sm text-text-primary">{verifierName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-text-muted uppercase">Status</span>
                        <span className="px-3 py-1 bg-rlusd-primary/20 text-rlusd-glow rounded-md border border-rlusd-primary/40 font-mono text-xs font-bold">
                          CONFIRMED
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-text-muted font-mono">
                      ✓ Milestone status updated to "verified"
                    </p>
                    <p className="text-sm text-text-muted font-mono">
                      ✓ Platform attestation record created
                    </p>
                    <p className="text-sm text-text-muted font-mono">
                      ✓ Shipowner and charterer notified
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
