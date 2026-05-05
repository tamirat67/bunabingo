'use client';
import { useEffect, useState } from 'react';
import { initTelegram, getTgUser } from '../lib/telegram';
import { getWallet, getTransactions } from '../lib/api';
import Navbar from '../components/Navbar';
import Link from 'next/link';

interface Wallet { balance: string; totalDeposited: string; totalWon: string; totalWithdrawn: string; totalSpent: string }
interface Txn { id: string; type: string; amount: string; description: string; createdAt: string }

const TXN_ICONS: Record<string, string> = {
  DEPOSIT: '📥', WITHDRAWAL: '📤', TICKET_PURCHASE: '🎫', PRIZE_WIN: '🏆', REFUND: '↩️',
};

export default function DashboardPage() {
  const [wallet, setWallet]   = useState<Wallet | null>(null);
  const [txns,   setTxns]     = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTg,   setNoTg]     = useState(false);
  const user = getTgUser();

  useEffect(() => {
    initTelegram();
    Promise.all([getWallet(), getTransactions()])
      .then(([w, t]) => { setWallet(w); setTxns(t.slice(0, 8)); })
      .catch(err => {
        if (err?.response?.status === 401 || !window.Telegram?.WebApp?.initData) {
          setNoTg(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Not in Telegram ──────────────────────────────── */
  if (noTg || (!loading && !wallet && !window?.Telegram?.WebApp?.initData)) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24, textAlign:'center', gap:16 }}>
        <div style={{ fontSize:72 }}>🎰</div>
        <div style={{ fontSize:26, fontWeight:800, background:'linear-gradient(135deg,var(--gold),#fff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          BunaBingo
        </div>
        <div style={{ fontSize:15, color:'var(--txt2)', maxWidth:280, lineHeight:1.6 }}>
          This Mini App must be opened inside <strong style={{color:'var(--txt)'}}>Telegram</strong>. Start the bot and tap the Play button!
        </div>
        <div className="card card-gold" style={{ width:'100%', maxWidth:320, padding:20, marginTop:8 }}>
          <div style={{ fontSize:13, color:'var(--txt2)', marginBottom:12 }}>Developers: running locally?</div>
          <div style={{ fontSize:12, color:'var(--txt3)', textAlign:'left', lineHeight:1.8 }}>
            1. Add <code style={{color:'var(--gold)'}}>BOT_TOKEN</code> to <code>backend/.env</code><br/>
            2. Start the bot: <code style={{color:'var(--gold)'}}>npm run dev</code><br/>
            3. Open your bot in Telegram → tap <strong>Play</strong>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading wallet…</span></div>;

  const fmt = (v: string | undefined) => Number(v || 0).toFixed(2);
  const isCredit = (type: string) => ['DEPOSIT', 'PRIZE_WIN', 'REFUND'].includes(type);

  return (
    <>
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div className="page-title">💰 Wallet</div>
          <div style={{ fontSize:13, color:'var(--txt2)', marginTop:2 }}>
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! 👋
          </div>
        </div>
        <div style={{ fontSize:32 }}>🎰</div>
      </div>

      <div className="section" style={{ gap:12 }}>
        <div className="bal-hero">
          <div className="bal-label">💵 Available Balance</div>
          <div className="bal-amount">
            <span style={{ fontSize:20, fontWeight:500, verticalAlign:'super', marginRight:4 }}>ETB</span>
            {fmt(wallet?.balance)}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Link href="/deposit"  className="btn btn-gold"  style={{ borderRadius:12 }}>📥 Deposit</Link>
          <Link href="/withdraw" className="btn btn-ghost" style={{ borderRadius:12 }}>💸 Withdraw</Link>
        </div>

        <Link href="/tickets" className="btn btn-gold btn-full btn-lg">🎮 Play Bingo Now</Link>
      </div>

      <div className="section">
        <div className="sec-title">Overview</div>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Total Deposited</div><div className="stat-val c-blue">{fmt(wallet?.totalDeposited)} <span style={{fontSize:12}}>ETB</span></div></div>
          <div className="stat-card"><div className="stat-label">Total Won 🏆</div><div className="stat-val c-gold">{fmt(wallet?.totalWon)} <span style={{fontSize:12}}>ETB</span></div></div>
          <div className="stat-card"><div className="stat-label">Tickets Spent</div><div className="stat-val c-red">{fmt(wallet?.totalSpent)} <span style={{fontSize:12}}>ETB</span></div></div>
          <div className="stat-card"><div className="stat-label">Withdrawn</div><div className="stat-val">{fmt(wallet?.totalWithdrawn)} <span style={{fontSize:12}}>ETB</span></div></div>
        </div>
      </div>

      <div className="section">
        <div className="flex justify-between items-center">
          <div className="sec-title">Recent Transactions</div>
          <Link href="/history" style={{ fontSize:12, color:'var(--gold)' }}>See all</Link>
        </div>
        <div className="card" style={{ padding:'8px 16px' }}>
          {txns.length === 0 && (
            <div style={{ padding:'20px 0', textAlign:'center', color:'var(--txt2)', fontSize:13 }}>
              No transactions yet. Deposit to get started!
            </div>
          )}
          {txns.map(t => (
            <div key={t.id} className="txn-item">
              <div className="txn-icon" style={{ background: isCredit(t.type) ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)' }}>
                {TXN_ICONS[t.type] || '💫'}
              </div>
              <div style={{ flex:1 }}>
                <div className="txn-label">{t.description || t.type.replace(/_/g,' ')}</div>
                <div className="txn-date">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className={`txn-amt ${isCredit(t.type) ? 'credit' : 'debit'}`}>
                {isCredit(t.type) ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Navbar />
    </>
  );
}
