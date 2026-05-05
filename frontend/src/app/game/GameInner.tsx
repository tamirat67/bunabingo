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
  WAITING:   { label: '⏳ Waiting for Players', color: 'var(--txt2)'  },
  COUNTDOWN: { label: '⏱ Starting Soon',        color: 'var(--gold)'  },
  RUNNING:   { label: '🎯 LIVE',                 color: 'var(--green)' },
  FINISHED:  { label: '🏁 Finished',             color: 'var(--txt2)'  },
  CANCELLED: { label: '🚫 Cancelled',            color: 'var(--red)'   },
};

export default function GameInner() {
  const params      = useSearchParams();
  const gameId      = params.get('id') ?? '';

  const [game,       setGame]      = useState<GameState | null>(null);
  const [myCard,     setMyCard]    = useState<Cell[][] | null>(null);
  const [drawn,      setDrawn]     = useState<number[]>([]);
  const [lastBall,   setLastBall]  = useState<number | null>(null);
  const [countdown,  setCd]        = useState<number | null>(null);
  const [winEvent,   setWinEvent]  = useState<WinEvent | null>(null);
  const [loading,    setLoading]   = useState(true);
  const cdRef = useRef<NodeJS.Timeout | null>(null);

  /* ── load initial state ─────────────────────────────────── */
  useEffect(() => {
    if (!gameId) return;
    Promise.all([getGame(gameId), getMyCard(gameId)])
      .then(([g, t]) => {
        setGame(g);
        setMyCard(t.card);
        const nums: number[] = g.drawHistory.map((d: any) => d.number);
        setDrawn(nums);
        if (nums.length) setLastBall(nums[nums.length - 1]);
        if (g.status === 'COUNTDOWN' && g.countdownSeconds) startCd(g.countdownSeconds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

  /* ── Pusher realtime ────────────────────────────────────── */
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
    ch.bind('countdown-update', (d: { seconds: number }) => {
      if (cdRef.current) clearInterval(cdRef.current);
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
    ch.bind('game-cancelled',   () => setGame(g => g ? { ...g, status: 'CANCELLED' } : g));
    ch.bind('player-joined',    (d: { playerCount: number }) =>
      setGame(g => g ? { ...g, tickets: Array(d.playerCount).fill({}) } : g));

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

  /* ── render ─────────────────────────────────────────────── */
  if (loading) return <div className="loading"><div className="spinner" /><span>Loading game…</span></div>;

  if (!game || !myCard) return (
    <div className="loading">
      <div style={{ fontSize: 52 }}>😕</div>
      <span style={{ color: 'var(--txt2)' }}>You haven't joined this game</span>
      <a href="/tickets" className="btn btn-gold btn-sm" style={{ marginTop: 16 }}>🎫 Buy Ticket</a>
    </div>
  );

  const status   = STATUS_MAP[game.status] || { label: game.status, color: 'var(--txt2)' };
  const minPl    = game.room.type === 'CASUAL' ? 2 : game.room.type === 'STANDARD' ? 5 : 20;
  const CIRC     = 2 * Math.PI * 42;
  const maxCd    = game.countdownSeconds ?? 30;

  return (
    <>
      {winEvent && (
        <WinnerPopup
          winMode={winEvent.winMode}
          amount={winEvent.prizeAmount}
          onClose={() => setWinEvent(null)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-hdr">
        <div>
          <div className="page-title">🎰 {game.room.type} Room</div>
          <div style={{ fontSize: 13, marginTop: 2, color: status.color, fontWeight: 600 }}>{status.label}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--txt2)' }}>Prize Pool</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
            {Number(game.totalPrize).toFixed(0)} <span style={{ fontSize: 13 }}>ETB</span>
          </div>
        </div>
      </div>

      <div className="section" style={{ gap: 10 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-muted">👥 {game.tickets.length} players</span>
          <span className="badge badge-muted">🎟 {Number(game.room.ticketPrice).toFixed(0)} ETB</span>
          <span className="badge badge-muted">🔢 {drawn.length} drawn</span>
        </div>

        {/* ── Countdown ──────────────────────────────────────── */}
        {game.status === 'COUNTDOWN' && countdown !== null && (
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 12 }}>Game starts in</div>
            <div className="cd-wrap">
              <svg width="96" height="96">
                <circle cx="48" cy="48" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="48" cy="48" r="42" fill="none" stroke="var(--gold)" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - countdown / maxCd)}
                  style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
              </svg>
              <div className="cd-num">{countdown}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 10 }}>
              Need {minPl}+ players to start · {game.tickets.length} joined
            </div>
          </div>
        )}

        {/* ── Waiting ────────────────────────────────────────── */}
        {game.status === 'WAITING' && (
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>⏳</div>
            <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>Waiting for players</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)' }}>
              Game auto-starts when {minPl}+ players join<br />
              Currently: <strong style={{ color: 'var(--txt)' }}>{game.tickets.length}</strong> / {minPl}
            </div>
          </div>
        )}

        {/* ── Last Ball ─────────────────────────────────────── */}
        {(game.status === 'RUNNING' || game.status === 'FINISHED') && lastBall && (
          <div className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 12 }}>Last Number Drawn</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div className="draw-ball">{lastBall}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 12 }}>#{drawn.length} of 75</div>
            {/* Recent balls mini row */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[...drawn].reverse().slice(1, 13).map(n => (
                <div key={n} className="mini-ball">{n}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bingo Card ────────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 0', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🃏 Your Card</span>
            {drawn.length > 0 && <span style={{ fontSize: 12, color: 'var(--txt2)' }}>Auto-marking ✅</span>}
          </div>
          <BingoCard card={myCard} drawnNumbers={drawn} />
        </div>

        {/* ── Winners ───────────────────────────────────────── */}
        {game.winners.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>🏆 Winners</div>
            {game.winners.map((w, i) => (
              <div key={i} className="txn-item">
                <div className="txn-icon" style={{ background: 'rgba(245,197,66,.1)' }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <div className="txn-label">{w.user?.firstName || 'Player'}</div>
                  <div className="txn-date">{w.winMode.replace(/_/g, ' ')}</div>
                </div>
                <div className="txn-amt credit">+{Number(w.prizeAmount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Cancelled ─────────────────────────────────────── */}
        {game.status === 'CANCELLED' && (
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Game Cancelled</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 16 }}>Your ticket cost has been refunded to your wallet.</div>
            <a href="/tickets" className="btn btn-gold btn-full">🎮 Join Another Game</a>
          </div>
        )}

        {game.status === 'FINISHED' && (
          <a href="/tickets" className="btn btn-gold btn-full btn-lg">🎮 Play Again</a>
        )}
      </div>

      <Navbar />
    </>
  );
}
