'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getHistory, getMyTickets, getMe } from '../../lib/api';
import Navbar from '../../components/Navbar';
import { Trophy, Gamepad2, ChevronLeft, Star, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';

interface Winner { id: string; winMode: string; prizeAmount: string; paidAt: string; game: { room: { type: string } } }
interface Ticket { id: string; isWinner: boolean; purchasedAt: string; game: { status: string; room: { type: string } } }

const MODE_ICON: Record<string, any> = { 
  ROW: '🔴', COLUMN: '🟡', DIAGONAL: '🟢', FOUR_CORNERS: '🔵', FULL_HOUSE: '💎' 
};

function HistoryContent() {
  const router = useRouter();
  const [wins, setWins] = useState<Winner[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<'wins' | 'games'>('games');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    Promise.all([getHistory(), getMyTickets(), getMe()])
      .then(([w, t, u]) => { 
        setWins(w); 
        setTickets(t);
        setUser(u);
      })
      .catch(err => console.error('History load failed', err))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    RUNNING:   { label: 'Live',      color: '#22c55e' },
    FINISHED:  { label: 'Finished',  color: 'rgba(255,255,255,0.4)' },
    WAITING:   { label: 'Waiting',   color: 'rgba(255,255,255,0.2)' },
    COUNTDOWN: { label: 'Starting',  color: 'var(--gold-accent)'  },
    CANCELLED: { label: 'Cancelled', color: '#ef4444'   },
  };

  const totalWon = wins.reduce((s, w) => s + Number(w.prizeAmount), 0);
  const winRate = tickets.length ? ((wins.length / tickets.length) * 100).toFixed(0) : 0;

  if (loading) return <div className="loading"><div className="spinner" /><span>LOADING HISTORY...</span></div>;

  return (
    <div className="buna-history-container">
      {/* Header Navigation */}
      <div className="top-header-nav">
        <button className="btn-back-nav" onClick={() => router.push('/')}>
          <ChevronLeft size={24} />
        </button>
        <div className="title-stack">
          <h1>Game History</h1>
          <p>Your Bingo Journey</p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="history-dashboard">
        <div className="main-stat-card">
           <div className="l"><TrendingUp size={14} /> Total Winnings</div>
           <div className="v">{totalWon.toFixed(0)} <span>ETB</span></div>
           <div className="b">Overall Profit</div>
        </div>
        <div className="mini-stats-grid">
           <div className="mini-capsule">
              <div className="l">Games</div>
              <div className="v">{tickets.length}</div>
           </div>
           <div className="mini-capsule">
              <div className="l">Wins</div>
              <div className="v gold">{wins.length}</div>
           </div>
           <div className="mini-capsule">
              <div className="l">Win Rate</div>
              <div className="v">{winRate}%</div>
           </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="pro-tab-bar">
         <button className={`tab-item ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
            <Gamepad2 size={18} />
            <span>All Games</span>
         </button>
         <button className={`tab-item ${tab === 'wins' ? 'active' : ''}`} onClick={() => setTab('wins')}>
            <Trophy size={18} />
            <span>Wins Only</span>
         </button>
      </div>

      {/* Content Area */}
      <div className="history-list-area">
        {tab === 'games' ? (
          <div className="scroll-list">
            {tickets.length === 0 && <div className="empty-msg">No games recorded yet.</div>}
            {tickets.map(t => {
              const sb = STATUS_BADGE[t.game.status] || { label: t.game.status, color: 'gray' };
              return (
                <div key={t.id} className="history-item">
                  <div className={`item-icon ${t.isWinner ? 'win' : ''}`}>
                    {t.isWinner ? <Trophy size={20} /> : <Gamepad2 size={20} />}
                  </div>
                  <div className="item-info">
                    <div className="row-top">
                       <span className="room-type">{t.game.room.type} ROOM</span>
                       <span className="status-pill" style={{ color: sb.color, borderColor: sb.color }}>{sb.label}</span>
                    </div>
                    <div className="row-bottom">
                       <span className="date-stamp"><Calendar size={12} /> {new Date(t.purchasedAt).toLocaleDateString()}</span>
                       {t.isWinner && <span className="win-badge">WINNER!</span>}
                    </div>
                  </div>
                  <div className="item-action">
                     <ArrowUpRight size={16} opacity={0.3} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="scroll-list">
            {wins.length === 0 && <div className="empty-msg">No winning moments yet. Keep playing!</div>}
            {wins.map(w => (
              <div key={w.id} className="history-item win-highlight">
                <div className="item-icon win">
                   <Star size={20} />
                </div>
                <div className="item-info">
                  <div className="row-top">
                     <span className="room-type">{w.winMode.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="row-bottom">
                     <span className="date-stamp">{w.game.room.type} · {new Date(w.paidAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="item-price">
                   <span className="plus">+</span>
                   {Number(w.prizeAmount).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />

      
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /><span>PREPARING HISTORY...</span></div>}>
      <HistoryContent />
    </Suspense>
  );
}

