'use client';
import { useState } from 'react';
import { createDeposit } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('amount', String(amt));
      if (reference) fd.append('reference', reference);
      if (file) fd.append('screenshot', file);
      await createDeposit(fd);
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  }

  const QUICK = [50, 100, 200, 500, 1000];

  return (
    <>
      <div className="page-hdr"><div className="page-title">📥 Deposit</div></div>

      {done ? (
        <div className="section">
          <div className="card text-center" style={{ padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Request Submitted!</div>
            <div style={{ color: 'var(--txt2)', fontSize: 14, marginBottom: 24 }}>
              Your deposit is under review. Usually credited within 30 minutes.
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => { setDone(false); setAmount(''); setReference(''); setFile(null); }}>
              Make Another Deposit
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="section">
            {/* Instructions */}
            <div className="card card-gold">
              <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--gold)' }}>📋 How to Deposit</div>
              {['Transfer money via CBE, Telebirr, or HelloCash', 'Enter the exact amount below', 'Paste your payment reference number', 'Upload screenshot (recommended)', 'Admin verifies & credits within 30 min'].map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 5, display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--gold)' }}>{i + 1}.</span>{s}
                </div>
              ))}
            </div>

            {/* Quick amounts */}
            <div>
              <div className="sec-title" style={{ marginBottom: 8 }}>Quick Amount (ETB)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QUICK.map(q => (
                  <button key={q} type="button"
                    className={`btn btn-sm ${amount === String(q) ? 'btn-gold' : 'btn-ghost'}`}
                    onClick={() => setAmount(String(q))}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="fg">
              <label className="flabel">Amount (ETB) *</label>
              <input className="finput" type="number" min="10" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>

            <div className="fg">
              <label className="flabel">Payment Reference</label>
              <input className="finput" type="text" placeholder="e.g. TXN123456" value={reference} onChange={e => setReference(e.target.value)} />
            </div>

            <div className="fg">
              <label className="flabel">Screenshot (optional)</label>
              <input className="finput" type="file" accept="image/*,.pdf"
                style={{ padding: '10px 16px', cursor: 'pointer' }}
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            {error && <div className="badge badge-red" style={{ padding: '10px 14px', borderRadius: 10 }}>⚠️ {error}</div>}

            <button className="btn btn-gold btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : '📥 Submit Deposit'}
            </button>
          </div>
        </form>
      )}
      <Navbar />
    </>
  );
}
