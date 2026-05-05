'use client';
import { useEffect, useState } from 'react';
import {
  adminAnalytics, adminPendingDeposits, adminApproveDeposit, adminRejectDeposit,
  adminPendingWithdrawals, adminApproveWithdrawal, adminRejectWithdrawal,
  adminActiveGames, adminUsers,
} from '../../lib/api';

type Tab = 'overview' | 'deposits' | 'withdrawals' | 'games' | 'users';

interface Analytics { totalUsers: number; totalGames: number; activeGames: number; totalDeposited: string; totalWithdrawn: string; pendingDeposits: number; pendingWithdrawals: number }
interface DepositReq { id: string; amount: string; reference: string; createdAt: string; user: { firstName: string; telegramUsername: string; telegramId: string }; screenshotUrl?: string }
interface WithdrawalReq { id: string; amount: string; bankName: string; accountName: string; accountNumber: string; createdAt: string; user: { firstName: string; telegramUsername: string } }

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalReq[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<{ id: string; type: 'deposit' | 'withdrawal' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'overview') setAnalytics(await adminAnalytics());
      else if (tab === 'deposits') setDeposits(await adminPendingDeposits());
      else if (tab === 'withdrawals') setWithdrawals(await adminPendingWithdrawals());
      else if (tab === 'games') setGames(await adminActiveGames());
      else if (tab === 'users') { const r = await adminUsers(); setUsers(r.users); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function approve(type: 'deposit' | 'withdrawal', id: string) {
    setProcessing(id);
    try {
      if (type === 'deposit') { await adminApproveDeposit(id); setDeposits(p => p.filter(d => d.id !== id)); }
      else { await adminApproveWithdrawal(id); setWithdrawals(p => p.filter(d => d.id !== id)); }
    } finally { setProcessing(null); }
  }

  async function reject() {
    if (!rejectId || !rejectReason.trim()) return;
    setProcessing(rejectId.id);
    try {
      if (rejectId.type === 'deposit') { await adminRejectDeposit(rejectId.id, rejectReason); setDeposits(p => p.filter(d => d.id !== rejectId.id)); }
      else { await adminRejectWithdrawal(rejectId.id, rejectReason); setWithdrawals(p => p.filter(d => d.id !== rejectId.id)); }
      setRejectId(null); setRejectReason('');
    } finally { setProcessing(null); }
  }

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview',     label: '📊 Overview' },
    { key: 'deposits',     label: '📥 Deposits',     badge: analytics?.pendingDeposits },
    { key: 'withdrawals',  label: '📤 Withdrawals',  badge: analytics?.pendingWithdrawals },
    { key: 'games',        label: '🎮 Games' },
    { key: 'users',        label: '👥 Users' },
  ];

  return (
    <>
      {/* Reject Modal */}
      {rejectId && (
        <div className="overlay">
          <div className="card" style={{ maxWidth: 340, width: '90%', padding: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>❌ Reject Reason</div>
            <textarea className="finput" rows={3} placeholder="Enter reason…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ resize: 'none' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost btn-full" onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn btn-danger btn-full" onClick={reject} disabled={!rejectReason.trim() || !!processing}>
                {processing ? '…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-hdr"><div className="page-title">🛡️ Admin</div></div>

      {/* Tab bar */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab === t.key ? 'btn-gold' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}>
            {t.label}{t.badge ? ` (${t.badge})` : ''}
          </button>
        ))}
      </div>

      <div className="section">
        {loading && <div className="loading" style={{ minHeight: 200 }}><div className="spinner" /></div>}

        {/* Overview */}
        {tab === 'overview' && analytics && !loading && (
          <>
            <div className="admin-grid">
              {[
                { v: analytics.totalUsers,           l: 'Total Users',           },
                { v: analytics.totalGames,           l: 'Games Played',          },
                { v: analytics.activeGames,          l: 'Active Games',          },
                { v: analytics.pendingDeposits,      l: '⚠️ Pending Deposits',   },
                { v: analytics.pendingWithdrawals,   l: '⚠️ Pending Withdrawals' },
              ].map((s, i) => (
                <div key={i} className="admin-stat">
                  <div className="admin-val">{s.v}</div>
                  <div className="admin-lbl">{s.l}</div>
                </div>
              ))}
              <div className="admin-stat">
                <div className="admin-val" style={{ fontSize: 18 }}>{Number(analytics.totalDeposited || 0).toFixed(0)}</div>
                <div className="admin-lbl">Total Deposited (ETB)</div>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--txt2)', textAlign: 'center' }}>
                Revenue = Deposited − Withdrawn<br />
                <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
                  {(Number(analytics.totalDeposited || 0) - Number(analytics.totalWithdrawn || 0)).toFixed(2)} ETB
                </span>
              </div>
            </div>
          </>
        )}

        {/* Deposits */}
        {tab === 'deposits' && !loading && (
          <>
            {deposits.length === 0 && <div className="card text-center" style={{ padding: 30, color: 'var(--txt2)' }}>✅ No pending deposits</div>}
            {deposits.map(d => (
              <div key={d.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.user.firstName} {d.user.telegramUsername ? `@${d.user.telegramUsername}` : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{new Date(d.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{Number(d.amount).toFixed(0)} ETB</div>
                </div>
                {d.reference && <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>Ref: {d.reference}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-full btn-sm" onClick={() => approve('deposit', d.id)} disabled={processing === d.id}>
                    {processing === d.id ? '…' : '✅ Approve'}
                  </button>
                  <button className="btn btn-danger btn-full btn-sm" onClick={() => setRejectId({ id: d.id, type: 'deposit' })}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && !loading && (
          <>
            {withdrawals.length === 0 && <div className="card text-center" style={{ padding: 30, color: 'var(--txt2)' }}>✅ No pending withdrawals</div>}
            {withdrawals.map(w => (
              <div key={w.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{w.user.firstName}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{new Date(w.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>−{Number(w.amount).toFixed(0)} ETB</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 10 }}>
                  🏦 {w.bankName} · {w.accountName} · {w.accountNumber}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-full btn-sm" onClick={() => approve('withdrawal', w.id)} disabled={processing === w.id}>
                    {processing === w.id ? '…' : '✅ Approve'}
                  </button>
                  <button className="btn btn-danger btn-full btn-sm" onClick={() => setRejectId({ id: w.id, type: 'withdrawal' })}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Active Games */}
        {tab === 'games' && !loading && (
          <>
            {games.length === 0 && <div className="card text-center" style={{ padding: 30, color: 'var(--txt2)' }}>No active games</div>}
            {games.map(g => (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{g.room.type} Room</div>
                    <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>ID: {g.id.slice(0, 8)}…</div>
                  </div>
                  <span className={`badge ${g.status === 'RUNNING' ? 'badge-green' : g.status === 'COUNTDOWN' ? 'badge-gold' : 'badge-muted'}`}>
                    {g.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <span className="badge badge-muted">👥 {g.tickets.length} players</span>
                  {g.drawHistory[0] && <span className="badge badge-blue">🔢 Last: {g.drawHistory[0].number}</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Users */}
        {tab === 'users' && !loading && (
          <div className="card" style={{ padding: '8px 16px' }}>
            {users.map((u: any) => (
              <div key={u.id} className="txn-item">
                <div className="txn-icon" style={{ background: 'rgba(255,255,255,.05)' }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div className="txn-label">{u.firstName} {u.telegramUsername ? `@${u.telegramUsername}` : ''}</div>
                  <div className="txn-date">Bal: {Number(u.wallet?.balance || 0).toFixed(0)} ETB · Joined {new Date(u.registeredAt).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : u.status === 'BANNED' ? 'badge-red' : 'badge-gold'}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
