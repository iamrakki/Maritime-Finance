'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Waves } from 'lucide-react';
import { signTerMemoWithRegistry } from '@/lib/ter-memo-sign';
import { getOrderedTerMemo, validateTerMemo, type TerMemo } from '@/lib/ter-memo';
import { fromHex } from '@/lib/hex-utils';

type RegistryMemo = {
  txHash: string;
  createdAt: string;
  memoHex: string;
  memoTypeHex?: string;
  memoFormatHex?: string;
  ledgerStatus?: string;
};

function randomTerScore(): number {
  return Math.round((0.6 + Math.random() * 0.4) * 100) / 100;
}

function calculateTerScoreFromMemo(memo: TerMemo): number {
  const parts = [
    memo.ter_id,
    memo.voyage_id,
    memo.registry_id,
    memo.shipowner_id,
    memo.charterer_id,
    memo.currency,
    memo.issued_at,
    String(memo.amount),
    String(memo.total_settlements),
    memo.settlement_refs.join('|'),
    JSON.stringify(memo.rates),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < parts.length; i += 1) {
    hash = (hash * 31 + parts.charCodeAt(i)) >>> 0;
  }
  const normalized = 0.6 + (hash % 4000) / 10000;
  return Math.round(normalized * 100) / 100;
}

function getUniqueDids(memos: RegistryMemo[]): string[] {
  const dids = new Set<string>();
  for (const memo of memos) {
    const decoded = decodeMemo(memo.memoHex);
    if (decoded?.shipowner_id) {
      dids.add(decoded.shipowner_id);
    }
  }
  return Array.from(dids);
}

function MemoVisualizer() {
  const [memos, setMemos] = useState<RegistryMemo[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDid, setSelectedDid] = useState('');
  const [didScore, setDidScore] = useState(0);
  const refreshSeqRef = useRef(0);
  const didOptions = useMemo(() => getUniqueDids(memos), [memos]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const seq = refreshSeqRef.current + 1;
      refreshSeqRef.current = seq;
      try {
        const response = await fetch('/api/registry/memos', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
          next: { revalidate: 0 },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data?.error || 'Failed to load registry memos');
        }

        const incoming = Array.isArray(data.memos) ? (data.memos as RegistryMemo[]) : [];
        const map = new Map<string, RegistryMemo>();
        for (const entry of incoming) {
          if (entry?.txHash) {
            map.set(entry.txHash, entry);
          }
        }

        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const capped = sorted.slice(0, 50);

        if (!isActive || refreshSeqRef.current !== seq) {
          return;
        }

        setMemos(capped);
        setSelectedHash(prev => {
          if (prev && capped.some(entry => entry.txHash === prev)) {
            return prev;
          }
          return capped[0]?.txHash || null;
        });
        setError(null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load registry memos');
      }
    };

    load();
    const intervalId = setInterval(load, 6000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      isActive = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!didOptions.length) {
      if (selectedDid) {
        setSelectedDid('');
      }
      return;
    }
    setSelectedDid(prev => (prev && didOptions.includes(prev) ? prev : didOptions[0]));
  }, [didOptions, selectedDid]);

  useEffect(() => {
    if (!selectedDid) {
      setDidScore(0);
      return;
    }
    const memo = memos
      .map(entry => decodeMemo(entry.memoHex))
      .find(decoded => decoded?.shipowner_id === selectedDid);
    if (memo) {
      setDidScore(calculateTerScoreFromMemo(memo));
      return;
    }
    setDidScore(randomTerScore());
  }, [selectedDid, memos]);

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
        {error}
      </div>
    );
  }

  if (memos.length === 0) {
    return <p className="text-xs text-text-muted">No registry memos found.</p>;
  }

  const activeHash = selectedHash || memos[0].txHash;
  const activeMemo = memos.find(entry => entry.txHash === activeHash) || memos[0];
  const decoded = decodeMemo(activeMemo.memoHex);
  const validation = decoded ? validateTerMemo(decoded) : { ok: false, error: 'Decode failed' };
  const ordered = decoded && validation.ok ? getOrderedTerMemo(decoded) : null;
  const prettyJson = ordered ? JSON.stringify(ordered, null, 2) : null;

  return (
    <div className="flex flex-col gap-0 font-mono text-xs bg-gradient-to-b from-white/[0.02] to-transparent">
      {/* Top Control Section */}
      <div className="border-b border-white/10 p-4 space-y-3 bg-gradient-to-b from-white/[0.02] to-transparent">
        {/* DID Filter */}
        <div>
          <label className="text-[9px] text-white/50 uppercase tracking-widest block mb-2">Registry DID</label>
          <select
            value={selectedDid}
            onChange={event => {
              setSelectedDid(event.target.value);
            }}
            className="w-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all"
            disabled={!didOptions.length}
          >
            {didOptions.length ? (
              didOptions.map(option => (
                <option key={option} value={option} className="bg-maritime-dark">
                  {option}
                </option>
              ))
            ) : (
              <option value="" className="bg-maritime-dark">
                Scanning ledger...
              </option>
            )}
          </select>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.06] border border-white/15 rounded px-3 py-2">
            <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Ter Score</div>
            <div className="text-sm font-bold text-rlusd-glow tabular-nums">
              {didOptions.length ? didScore.toFixed(3) : '—'}
            </div>
          </div>
          <div className="bg-white/[0.06] border border-white/15 rounded px-3 py-2">
            <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Tx Count</div>
            <div className="text-sm font-bold text-rlusd-glow tabular-nums">
              {selectedDid ? memos.filter(entry => {
                const decoded = decodeMemo(entry.memoHex);
                return decoded?.shipowner_id === selectedDid;
              }).length : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Transactions List */}
        <div className="flex-1 flex flex-col border-b border-white/10">
          <div className="border-b border-white/10 px-4 py-3 bg-white/[0.04]">
            <h3 className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Transactions ({memos.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-3">
              {memos.map(entry => {
                const label = buildTabLabel(entry);
                const isActive = entry.txHash === activeHash;
                return (
                  <button
                    key={entry.txHash}
                    onClick={() => setSelectedHash(entry.txHash)}
                    className={`w-full text-left px-2.5 py-2 rounded text-[10px] transition-all border ${
                      isActive
                        ? 'bg-rlusd-primary/20 border-rlusd-primary/50 text-rlusd-glow font-semibold'
                        : 'bg-white/[0.05] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="truncate font-mono">{label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Payload Section */}
          <div className="flex-1 flex flex-col border-b border-white/10">
            <div className="border-b border-white/10 px-4 py-3 bg-white/[0.04]">
              <h3 className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Payload JSON</h3>
            </div>
            {prettyJson ? (
              <pre className="flex-1 overflow-auto px-4 py-3 text-[10px] text-green-400/80 leading-relaxed whitespace-pre-wrap break-words bg-white/[0.02]">
                {prettyJson}
              </pre>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="text-center">
                  <div className="text-red-400/60 text-[10px] mb-1">⚠ Decode Error</div>
                  <div className="text-white/30 text-[9px]">Validation failed</div>
                </div>
              </div>
            )}
          </div>

          {/* Hex & Metadata Section */}
          <div className="max-h-52 overflow-y-auto border-t border-white/10">
            <div className="border-b border-white/10 px-4 py-3 bg-white/[0.04] sticky top-0">
              <h3 className="text-[9px] text-white/50 uppercase tracking-widest font-bold">MemoData</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Raw Hex */}
              <div className="bg-white/[0.06] border border-white/15 rounded p-2.5">
                <div className="text-[9px] text-white/50 uppercase tracking-wider mb-2 font-bold">Hex</div>
                <pre className="text-[9px] text-white/60 overflow-x-auto max-h-20 break-all">
                  {activeMemo.memoHex}
                </pre>
              </div>

              {/* Metadata Grid */}
              <div className="space-y-1.5">
                {activeMemo.memoTypeHex && (
                  <div className="bg-white/[0.04] border border-white/10 rounded px-2.5 py-2">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Type</div>
                    <div className="text-[10px] text-white/70 font-mono mt-1 break-all">{activeMemo.memoTypeHex}</div>
                  </div>
                )}
                {activeMemo.memoFormatHex && (
                  <div className="bg-white/[0.04] border border-white/10 rounded px-2.5 py-2">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Format</div>
                    <div className="text-[10px] text-white/70 font-mono mt-1 break-all">{activeMemo.memoFormatHex}</div>
                  </div>
                )}
                {activeMemo.ledgerStatus && (
                  <div className="bg-white/[0.04] border border-white/10 rounded px-2.5 py-2">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Status</div>
                    <div className="text-[10px] text-white/70 font-mono mt-1">{activeMemo.ledgerStatus}</div>
                  </div>
                )}
                {!validation.ok && validation.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded px-2.5 py-2">
                    <div className="text-[9px] text-red-400 font-bold">VALIDATION ERROR</div>
                    <div className="text-[10px] text-red-300/70 mt-1">{validation.error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function decodeMemo(memoHex: string): TerMemo | null {
  try {
    const decoded = fromHex(memoHex);
    if (!decoded) {
      return null;
    }
    return JSON.parse(decoded) as TerMemo;
  } catch {
    return null;
  }
}

function buildTabLabel(entry: RegistryMemo): string {
  const decoded = decodeMemo(entry.memoHex);
  const shortHash = entry.txHash ? entry.txHash.slice(0, 6) : '??????';
  const timeLabel = entry.createdAt ? entry.createdAt.slice(11, 16) : '';

  if (!decoded || !validateTerMemo(decoded).ok) {
    return `Invalid • ${shortHash}`;
  }

  const terLabel = decoded.ter_id || 'TER';
  const score = getTerScore(decoded);
  const scoreLabel = typeof score === 'number' ? score.toFixed(2) : 'n/a';
  return `${terLabel} • ${scoreLabel} • ${shortHash}${timeLabel ? ` • ${timeLabel}` : ''}`;
}

function getTerScore(memo: TerMemo): number | null {
  const terScore = memo.rates?.ter_score;
  if (typeof terScore === 'number') {
    return terScore;
  }
  const performance = memo.rates?.performance;
  if (typeof performance === 'number') {
    return performance;
  }
  return null;
}

export default function TerMemoPage() {
  const [terForm, setTerForm] = useState({
    ter_id: '',
    voyage_id: '',
    registry_id: '',
    shipowner_id: '',
    charterer_id: '',
    amount: '',
    currency: '',
    rates_json: '',
    total_settlements: '',
    settlement_refs: '',
    issued_at: '',
  });
  const [submitToNetwork, setSubmitToNetwork] = useState(false);
  const [waitForValidation, setWaitForValidation] = useState(false);
  const [signingStatus, setSigningStatus] = useState<{
    state: 'idle' | 'signing' | 'success' | 'error';
    message?: string;
    hash?: string;
    signedBlob?: string;
    engineResult?: string;
    validated?: boolean;
    ledgerIndex?: number;
  }>({ state: 'idle' });

  const handleTerFieldChange = (field: keyof typeof terForm, value: string) => {
    setTerForm(prev => ({ ...prev, [field]: value }));
  };

  const buildTerMemo = (): { memo?: TerMemo; error?: string } => {
    const amount = Number(terForm.amount);
    const totalSettlements = Number(terForm.total_settlements);

    if (!Number.isFinite(amount)) {
      return { error: 'Amount must be a number' };
    }
    if (!Number.isFinite(totalSettlements)) {
      return { error: 'Total settlements must be a number' };
    }

    let rates: Record<string, number>;
    try {
      rates = JSON.parse(terForm.rates_json || '{}') as Record<string, number>;
    } catch (error) {
      return { error: 'Rates must be valid JSON' };
    }

    let settlementRefs: string[] = [];
    const refsInput = terForm.settlement_refs.trim();
    if (refsInput) {
      if (refsInput.startsWith('[')) {
        try {
          settlementRefs = JSON.parse(refsInput) as string[];
        } catch (error) {
          return { error: 'Settlement refs must be valid JSON array or comma-separated' };
        }
      } else {
        settlementRefs = refsInput.split(',').map(ref => ref.trim()).filter(Boolean);
      }
    }

    const memo: TerMemo = {
      ter_id: terForm.ter_id.trim(),
      voyage_id: terForm.voyage_id.trim(),
      registry_id: terForm.registry_id.trim(),
      shipowner_id: terForm.shipowner_id.trim(),
      charterer_id: terForm.charterer_id.trim(),
      amount,
      currency: terForm.currency.trim(),
      rates,
      total_settlements: totalSettlements,
      settlement_refs: settlementRefs,
      issued_at: terForm.issued_at.trim(),
    };

    return { memo };
  };

  const handleSignTerMemo = async () => {
    setSigningStatus({ state: 'signing', message: 'Signing TER memo with registry wallet...' });

    const { memo, error } = buildTerMemo();
    if (!memo) {
      setSigningStatus({ state: 'error', message: error });
      return;
    }

    try {
      const result = await signTerMemoWithRegistry(memo, {
        submit: submitToNetwork,
        waitForValidation,
      });

      if (!result.success) {
        setSigningStatus({ state: 'error', message: result.error || 'Signing failed' });
        return;
      }

      setSigningStatus({
        state: 'success',
        message: 'TER memo signed successfully.',
        hash: result.hash,
        signedBlob: result.signedBlob,
        engineResult: result.submitResult?.engineResult,
        validated: result.submitResult?.validated,
        ledgerIndex: result.submitResult?.ledgerIndex,
      });

    } catch (error) {
      setSigningStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Failed to sign TER memo',
      });
    }
  };

  return (
    <div className="min-h-screen bg-maritime-dark">
      <header className="border-b border-white/5 bg-maritime-deeper/80 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rlusd-primary/30 to-rlusd-primary/10 flex items-center justify-center border border-rlusd-primary/30">
              <Waves className="w-5 h-5 text-rlusd-glow" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-text-primary">
                Registry TER Memo
              </h1>
              <p className="text-xs text-text-muted">Sign voyage memos with the registry wallet</p>
            </div>
          </div>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-text-secondary text-sm hover:bg-maritime-slate/30 transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6 items-start">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rlusd-primary/20 to-rlusd-primary/5 flex items-center justify-center border border-rlusd-primary/30">
                  <Shield className="w-6 h-6 text-rlusd-glow" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-text-primary">
                    TER Memo Payload
                  </h2>
                  <p className="text-sm text-text-muted">
                    Fill the schema fields and sign on XRPL.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">TER ID</label>
                    <input
                      value={terForm.ter_id}
                      onChange={e => handleTerFieldChange('ter_id', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="TER-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Voyage ID</label>
                    <input
                      value={terForm.voyage_id}
                      onChange={e => handleTerFieldChange('voyage_id', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="VOY-2024-001"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Registry ID</label>
                    <input
                      value={terForm.registry_id}
                      onChange={e => handleTerFieldChange('registry_id', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="REG-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Shipowner DID</label>
                    <input
                      value={terForm.shipowner_id}
                      onChange={e => handleTerFieldChange('shipowner_id', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="SHIP-001"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Charterer ID</label>
                    <input
                      value={terForm.charterer_id}
                      onChange={e => handleTerFieldChange('charterer_id', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="CHART-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Currency</label>
                    <input
                      value={terForm.currency}
                      onChange={e => handleTerFieldChange('currency', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Amount</label>
                    <input
                      value={terForm.amount}
                      onChange={e => handleTerFieldChange('amount', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="250000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Issued At (ISO)</label>
                    <input
                      value={terForm.issued_at}
                      onChange={e => handleTerFieldChange('issued_at', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="2025-01-01T00:00:00Z"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Total Settlements</label>
                    <input
                      value={terForm.total_settlements}
                      onChange={e => handleTerFieldChange('total_settlements', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Settlement Refs (CSV or JSON array)</label>
                    <input
                      value={terForm.settlement_refs}
                      onChange={e => handleTerFieldChange('settlement_refs', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary"
                      placeholder="SETT-001,SETT-002"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted">Rates JSON (0..1 values)</label>
                  <textarea
                    value={terForm.rates_json}
                    onChange={e => handleTerFieldChange('rates_json', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-maritime-slate/20 border border-white/10 text-sm text-text-primary min-h-[96px]"
                    placeholder='{"performance":0.95,"settlement":0.98}'
                  />
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm text-text-muted">
                    <input
                      type="checkbox"
                      checked={submitToNetwork}
                      onChange={e => setSubmitToNetwork(e.target.checked)}
                      className="rounded border-white/10 bg-maritime-slate/30"
                    />
                    Submit to XRPL
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-muted">
                    <input
                      type="checkbox"
                      checked={waitForValidation}
                      onChange={e => setWaitForValidation(e.target.checked)}
                      className="rounded border-white/10 bg-maritime-slate/30"
                      disabled={!submitToNetwork}
                    />
                    Wait for validation
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSignTerMemo}
                    disabled={signingStatus.state === 'signing'}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      signingStatus.state === 'signing'
                        ? 'bg-maritime-slate/30 text-text-muted cursor-not-allowed'
                        : 'bg-gradient-to-r from-rlusd-dim to-rlusd-primary text-white hover:shadow-glow-md'
                    }`}
                  >
                    {signingStatus.state === 'signing' ? 'Signing...' : 'Sign TER Memo'}
                  </button>
                </div>

                {signingStatus.state === 'error' && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                    {signingStatus.message}
                  </div>
                )}

                {signingStatus.state === 'success' && (
                  <div className="p-3 rounded-lg bg-rlusd-primary/10 border border-rlusd-primary/30 text-sm text-text-primary space-y-2">
                    <p>{signingStatus.message}</p>
                    {signingStatus.hash && (
                      <div>
                        <p className="text-xs text-text-muted">Transaction Hash</p>
                        <p className="font-mono text-xs break-all">{signingStatus.hash}</p>
                      </div>
                    )}
                    {signingStatus.signedBlob && (
                      <div>
                        <p className="text-xs text-text-muted">Signed Blob</p>
                        <p className="font-mono text-xs break-all">{signingStatus.signedBlob}</p>
                      </div>
                    )}
                    {signingStatus.engineResult && (
                      <p className="text-xs text-text-muted">
                        Engine Result: {signingStatus.engineResult}
                        {signingStatus.validated ? ' (validated)' : ''}
                        {signingStatus.ledgerIndex ? ` • Ledger ${signingStatus.ledgerIndex}` : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="sticky top-0 h-[600px] flex flex-col">
              <div className="border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-lg overflow-hidden flex flex-col h-full">
                <div className="border-b border-white/10 px-4 py-3 bg-white/[0.06] flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Activity Monitor</p>
                    <p className="text-[10px] text-white/40 font-mono mt-1">ledger.registry.ter</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-white/40">LIVE</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <MemoVisualizer />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
