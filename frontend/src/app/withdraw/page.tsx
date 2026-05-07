'use client';
import { useEffect, useState } from 'react';
import { getWallet, getWithdrawals, createWithdrawal } from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Withdrawal { id: string; amount: string; status: string; bankName: string; createdAt: string; adminNote?: string }

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: '⏳ Pending',    cls: 'badge-gold' },
  APPROVED:   { label: '✅ Approved',   cls: 'badge-green' },
  COMPLETED:  { label: '✅ Completed',  cls: 'badge-green' },
  REJECTED:   { label: '❌ Rejected',   cls: 'badge-red' },
  PROCESSING: { label: '⚙️ Processing', cls: 'badge-blue' },
};

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', accountName: '', accountNumber: '', bankName: '' });

  useEffect(() => {
    Promise.all([getWallet(), getWithdrawals()])
      .then(([w, h]) => { setBalance(Number(w.balance)); setHistory(h); })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (!amt || amt < 50) return setError('Minimum withdrawal is 50 ETB');
    if (amt > balance) return setError('Insufficient balance');
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) return setError('All fields are required');
    setSubmitting(true);
    try {
      await createWithdrawal({ amount: amt, accountName: form.accountName, accountNumber: form.accountNumber, bankName: form.bankName });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  const BANKS = ['CBE', 'Awash Bank', 'Dashen Bank', 'Abyssinia Bank', 'Telebirr', 'HelloCash', 'Other'];

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-hdr"><div className="page-title">💸 Withdraw</div></div>

      <div className="section">
        {/* Balance */}
        <div className="card-gold card">
          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 4 }}>Available Balance</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>{balance.toFixed(2)} <span style={{ fontSize: 16 }}>ETB</span></div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 4 }}>Min: 50 ETB · Max: 10,000 ETB</div>
        </div>

        {done ? (
          <div className="card text-center" style={{ padding: 36 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>Request Submitted!</div>
            <div style={{ color: 'var(--txt2)', fontSize: 13, marginBottom: 20 }}>Your withdrawal is pending admin approval. Usually processed within 2 hours.</div>
            <button className="btn btn-ghost btn-full" onClick={() => { setDone(false); setForm({ amount: '', accountName: '', accountNumber: '', bankName: '' }); }}>
              New Request
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fg">
              <label className="flabel">Amount (ETB) *</label>
              <input className="finput" type="number" min="50" max={balance} placeholder="Min 50 ETB"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[100, 200, 500, 1000].map(q => (
                <button key={q} type="button" className={`btn btn-sm ${form.amount === String(q) ? 'btn-gold' : 'btn-ghost'}`}
                  onClick={() => set('amount', String(q))} disabled={balance < q}>
                  {q}
                </button>
              ))}
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('amount', Math.floor(balance).toString())}>Max</button>
            </div>

            <div className="fg">
              <label className="flabel">Bank / Payment Method *</label>
              <select className="finput" value={form.bankName} onChange={e => set('bankName', e.target.value)} required
                style={{ appearance: 'none' }}>
                <option value="">Select bank</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="fg">
              <label className="flabel">Account Name *</label>
              <input className="finput" type="text" placeholder="Full name on account"
                value={form.accountName} onChange={e => set('accountName', e.target.value)} required />
            </div>

            <div className="fg">
              <label className="flabel">Account Number / Phone *</label>
              <input className="finput" type="text" placeholder="e.g. 0912345678"
                value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} required />
            </div>

            {error && <div className="badge badge-red" style={{ padding: '10px 14px', borderRadius: 10 }}>⚠️ {error}</div>}

            <button className="btn btn-gold btn-full btn-lg" type="submit" disabled={submitting || balance < 50}>
              {submitting ? 'Submitting…' : '💸 Request Withdrawal'}
            </button>
          </form>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <div className="sec-title">Recent Withdrawals</div>
            <div className="card" style={{ padding: '8px 16px' }}>
              {history.map(w => {
                const si = STATUS_INFO[w.status] || { label: w.status, cls: 'badge-muted' };
                return (
                  <div key={w.id} className="txn-item">
                    <div className="txn-icon" style={{ background: 'rgba(255,255,255,.05)' }}>💸</div>
                    <div style={{ flex: 1 }}>
                      <div className="txn-label">{w.bankName}</div>
                      <div className="txn-date">{new Date(w.createdAt).toLocaleString()}</div>
                      {w.adminNote && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{w.adminNote}</div>}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div className="txn-amt debit">{Number(w.amount).toFixed(2)}</div>
                      <span className={`badge ${si.cls}`}>{si.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Navbar />
    </>
  );
}

