'use client';
import { useEffect, useState } from 'react';
import { getHistory, getMyTickets } from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Winner { id: string; winMode: string; prizeAmount: string; paidAt: string; game: { room: { type: string } } }
interface Ticket { id: string; isWinner: boolean; purchasedAt: string; game: { status: string; room: { type: string } } }

const MODE_ICON: Record<string, string> = { ROW: '🔴', COLUMN: '🟡', DIAGONAL: '🟢', FOUR_CORNERS: '🔵', FULL_HOUSE: '💎' };

export default function HistoryPage() {
  const [wins, setWins] = useState<Winner[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<'wins' | 'games'>('games');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHistory(), getMyTickets()])
      .then(([w, t]) => { setWins(w); setTickets(t); })
      .finally(() => setLoading(false));
  }, []);

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    RUNNING:   { label: '🟢 Live',      cls: 'badge-green' },
    FINISHED:  { label: '🏁 Finished',  cls: 'badge-muted' },
    WAITING:   { label: '⏳ Waiting',   cls: 'badge-muted' },
    COUNTDOWN: { label: '⏱ Starting',  cls: 'badge-gold'  },
    CANCELLED: { label: '🚫 Cancelled', cls: 'badge-red'   },
  };

  const totalWon = wins.reduce((s, w) => s + Number(w.prizeAmount), 0);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading history…</span></div>;

  return (
    <>
      <div className="page-hdr"><div className="page-title">📊 History</div></div>

      <div className="section">
        {/* Summary */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Games Played</div>
            <div className="stat-val c-blue">{tickets.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Won 🏆</div>
            <div className="stat-val c-gold">{totalWon.toFixed(2)} <span style={{ fontSize: 11 }}>ETB</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Win Count</div>
            <div className="stat-val c-green">{wins.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Win Rate</div>
            <div className="stat-val">{tickets.length ? ((wins.length / tickets.length) * 100).toFixed(0) : 0}%</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['games', 'wins'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? 'btn-gold' : 'btn-ghost'}`}>
              {t === 'games' ? '🎮 All Games' : '🏆 Wins Only'}
            </button>
          ))}
        </div>

        {/* Games list */}
        {tab === 'games' && (
          <div className="card" style={{ padding: '8px 16px' }}>
            {tickets.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt2)', fontSize: 13 }}>No games yet. Play your first game!</div>}
            {tickets.map(t => {
              const sb = STATUS_BADGE[t.game.status] || { label: t.game.status, cls: 'badge-muted' };
              return (
                <div key={t.id} className="txn-item">
                  <div className="txn-icon" style={{ background: t.isWinner ? 'rgba(245,197,66,.1)' : 'rgba(255,255,255,.05)' }}>
                    {t.isWinner ? '🏆' : '🎮'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="txn-label">{t.game.room.type} Room</div>
                    <div className="txn-date">{new Date(t.purchasedAt).toLocaleString()}</div>
                  </div>
                  <span className={`badge ${sb.cls}`}>{sb.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Wins list */}
        {tab === 'wins' && (
          <div className="card" style={{ padding: '8px 16px' }}>
            {wins.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt2)', fontSize: 13 }}>No wins yet. Keep playing! 🎯</div>}
            {wins.map(w => (
              <div key={w.id} className="txn-item">
                <div className="txn-icon" style={{ background: 'rgba(245,197,66,.1)', fontSize: 20 }}>
                  {MODE_ICON[w.winMode] || '🏆'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="txn-label">{w.winMode.replace(/_/g, ' ')}</div>
                  <div className="txn-date">{w.game.room.type} · {new Date(w.paidAt).toLocaleString()}</div>
                </div>
                <div className="txn-amt credit">+{Number(w.prizeAmount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Navbar />
    </>
  );
}
