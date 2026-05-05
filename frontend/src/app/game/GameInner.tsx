'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Pusher from 'pusher-js';
import { getGame, getMyCard, pusherAuth } from '../../lib/api';
import BingoCard from '../../components/BingoCard';
import WinnerPopup from '../../components/WinnerPopup';
import Navbar from '../../components/Navbar';

type Cell = number | 'FREE';
interface GameState {
  status: string;
  countdownSeconds: number | null;
  drawHistory: { number: number; sequence: number }[];
  tickets: { userId: string }[];
  room: { type: string; ticketPrice: string };
  totalPrize: string;
  winners: { userId: string; winMode: string; prizeAmount: string; user: { firstName: string } }[];
}
interface WinEvent { userId: string; winMode: string; prizeAmount: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  WAITING:   { label: '⏳ Waiting for Players', color: '#6F4E37'  },
  COUNTDOWN: { label: '⏱ Starting Soon',        color: '#4B3621'  },
  RUNNING:   { label: '🎯 LIVE DRAW',            color: '#2d6a4f' },
  FINISHED:  { label: '🏁 Game Over',            color: '#000000'  },
  CANCELLED: { label: '🚫 Cancelled',            color: '#9a031e'   },
};

export default function GameInner() {
  const params      = useSearchParams();
  const gameId      = params.get('id') ?? '';

  const [game,       setGame]      = useState<GameState | null>(null);
  const [tickets,    setTickets]   = useState<any[]>([]);
  const [activeTicketIdx, setIdx]  = useState(0);
  const [drawn,      setDrawn]     = useState<number[]>([]);
  const [lastBall,   setLastBall]  = useState<number | null>(null);
  const [countdown,  setCd]        = useState<number | null>(null);
  const [winEvent,   setWinEvent]  = useState<WinEvent | null>(null);
  const [loading,    setLoading]   = useState(true);
  const cdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameId) return;
    Promise.all([getGame(gameId), getMyCard(gameId)])
      .then(([g, res]) => {
        setGame(g);
        setTickets(res.tickets || []);
        const nums: number[] = g.drawHistory.map((d: any) => d.number);
        setDrawn(nums);
        if (nums.length) setLastBall(nums[nums.length - 1]);
        if (g.status === 'COUNTDOWN' && g.countdownSeconds) startCd(g.countdownSeconds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authorizer: channel => ({
        authorize: async (socketId, cb) => {
          try { cb(null, await pusherAuth(socketId, channel.name)); }
          catch (e: any) { cb(e, null); }
        },
      }),
    });

    const ch = pusher.subscribe(`game-${gameId}`);
    ch.bind('countdown-start',  (d: { seconds: number; playerCount: number }) => {
      setGame(g => g ? { ...g, status: 'COUNTDOWN', countdownSeconds: d.seconds } : g);
      startCd(d.seconds);
    });
    ch.bind('game-started', () => {
      setGame(g => g ? { ...g, status: 'RUNNING' } : g);
      setCd(null);
    });
    ch.bind('number-drawn', (d: { number: number }) => {
      setLastBall(d.number);
      setDrawn(prev => [...prev, d.number]);
    });
    ch.bind('winner-announced', (d: WinEvent) => setWinEvent(d));
    ch.bind('game-finished',    () => setGame(g => g ? { ...g, status: 'FINISHED' } : g));

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
      if (cdRef.current) clearInterval(cdRef.current);
    };
  }, [gameId]);

  function startCd(secs: number) {
    setCd(secs);
    if (cdRef.current) clearInterval(cdRef.current);
    let s = secs;
    cdRef.current = setInterval(() => {
      s--;
      setCd(s);
      if (s <= 0) clearInterval(cdRef.current!);
    }, 1000);
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>LOADING ARENA...</span></div>;

  if (!game || tickets.length === 0) return (
    <div className="loading">
      <div style={{ fontSize: 64 }}>☕</div>
      <span style={{ color: '#4B3621' }}>No Active Tickets Found</span>
      <a href="/" className="btn btn-coffee" style={{ marginTop: 24 }}>🎮 Start Playing</a>
    </div>
  );

  const status   = STATUS_MAP[game.status] || { label: game.status, color: '#000' };
  const currentCard = tickets[activeTicketIdx]?.card;

  return (
    <div className="game-container">
      {winEvent && <WinnerPopup winMode={winEvent.winMode} amount={winEvent.prizeAmount} onClose={() => setWinEvent(null)} />}

      <div className="game-hdr">
        <div>
          <h1 className="room-title">Buna {game.room.type}</h1>
          <div className="status-indicator" style={{ color: status.color }}>
            <span className="dot pulse" style={{ background: status.color }}></span> {status.label}
          </div>
        </div>
        <div className="prize-box">
          <div className="lbl">PRIZE POOL</div>
          <div className="amt">{Number(game.totalPrize).toFixed(0)} <span className="sym">ETB</span></div>
        </div>
      </div>

      <div className="game-body">
        {/* Drawn Ball Display */}
        {(game.status === 'RUNNING' || game.status === 'FINISHED') && lastBall && (
          <div className="ball-section">
            <div className="ball-label">Current Ball</div>
            <div className="ball-main">{lastBall}</div>
            <div className="recent-balls">
              {[...drawn].reverse().slice(1, 7).map(n => <div key={n} className="mini-ball">{n}</div>)}
            </div>
          </div>
        )}

        {/* Countdown */}
        {game.status === 'COUNTDOWN' && countdown !== null && (
          <div className="countdown-card">
            <div className="cd-lbl">Coffee is Brewing...</div>
            <div className="cd-num">{countdown}</div>
            <div className="cd-sub">Seconds remaining</div>
          </div>
        )}

        {/* Multi-Card Switcher */}
        {tickets.length > 1 && (
          <div className="card-switcher">
            {tickets.map((_, i) => (
              <button key={i} className={`sw-btn ${activeTicketIdx === i ? 'active' : ''}`} onClick={() => setIdx(i)}>
                Card {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* The Bingo Card - Visibility Optimized */}
        <div className="bingo-area">
          <div className="card-meta">
            <span className="c-num">CARD #{activeTicketIdx + 1}</span>
            <span className="c-info">AUTO-MARKING ✅</span>
          </div>
          <div className="bingo-card-wrap">
             <BingoCard card={currentCard} drawnNumbers={drawn} />
          </div>
        </div>

        {/* Winners */}
        {game.winners.length > 0 && (
          <div className="winners-list">
            <h3 className="section-title">🏆 Recent Winners</h3>
            {game.winners.map((w, i) => (
              <div key={i} className="winner-row">
                <div className="w-icon">☕</div>
                <div className="w-info">
                   <div className="w-name">{w.user?.firstName || 'Player'}</div>
                   <div className="w-mode">{w.winMode.replace(/_/g, ' ')}</div>
                </div>
                <div className="w-amt">+{Number(w.prizeAmount).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />

      <style jsx>{`
        .game-container { min-height: 100vh; background: #F5E6BE; padding: 20px 16px 100px; color: #000; }
        
        .game-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .room-title { font-size: 24px; font-weight: 900; color: #4B3621; text-transform: uppercase; margin: 0; }
        .status-indicator { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; margin-top: 4px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }

        .prize-box { text-align: right; background: #4B3621; color: #F5E6BE; padding: 10px 16px; border-radius: 16px; box-shadow: 0 8px 20px rgba(75, 54, 33, 0.2); }
        .prize-box .lbl { font-size: 10px; font-weight: 800; opacity: 0.7; letter-spacing: 1px; }
        .prize-box .amt { font-size: 24px; font-weight: 900; }
        .prize-box .sym { font-size: 14px; opacity: 0.5; }

        .ball-section { background: white; border-radius: 24px; padding: 20px; text-align: center; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 2px solid #E6D5A8; }
        .ball-label { font-size: 12px; font-weight: 800; color: #6F4E37; text-transform: uppercase; margin-bottom: 12px; }
        .ball-main { width: 80px; height: 80px; background: #4B3621; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 900; margin: 0 auto 16px; box-shadow: 0 10px 20px rgba(75, 54, 33, 0.3); border: 4px solid #F5E6BE; }
        .recent-balls { display: flex; gap: 8px; justify-content: center; }
        .mini-ball { width: 32px; height: 32px; background: #F5E6BE; color: #4B3621; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; border: 1px solid #E6D5A8; }

        .countdown-card { background: #FFF9E6; border: 2px dashed #E6D5A8; padding: 30px; border-radius: 24px; text-align: center; margin-bottom: 20px; }
        .cd-num { font-size: 64px; font-weight: 900; color: #4B3621; line-height: 1; margin: 10px 0; }
        .cd-lbl { font-size: 14px; font-weight: 800; color: #6F4E37; }
        .cd-sub { font-size: 12px; opacity: 0.5; font-weight: 700; }

        .card-switcher { display: flex; gap: 8px; margin-bottom: 12px; }
        .sw-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #E6D5A8; background: #FFF9E6; font-weight: 800; color: #4B3621; cursor: pointer; }
        .sw-btn.active { background: #4B3621; color: #F5E6BE; border-color: #4B3621; }

        .bingo-area { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.1); border: 2px solid #4B3621; }
        .card-meta { background: #4B3621; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; color: #F5E6BE; font-size: 12px; font-weight: 900; }

        .winners-list { margin-top: 24px; }
        .section-title { font-size: 18px; font-weight: 900; color: #4B3621; margin-bottom: 16px; }
        .winner-row { display: flex; align-items: center; gap: 16px; padding: 12px; background: #FFF9E6; border-radius: 12px; margin-bottom: 8px; border: 1px solid #E6D5A8; }
        .w-icon { font-size: 24px; }
        .w-info { flex: 1; }
        .w-name { font-weight: 800; font-size: 15px; }
        .w-mode { font-size: 11px; font-weight: 700; color: #6F4E37; }
        .w-amt { font-size: 18px; font-weight: 900; color: #2d6a4f; }
      `}</style>
    </div>
  );
}
