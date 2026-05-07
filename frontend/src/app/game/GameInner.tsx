'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Pusher from 'pusher-js';
import { getGame, getMyCard, pusherAuth } from '../../lib/api';
import BingoCard from '../../components/BingoCard';
import WinnerPopup from '../../components/WinnerPopup';
import Navbar from '../../components/Navbar';
import { Target, Trophy, Info, Clock, Volume2 } from 'lucide-react';

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

export default function GameInner() {
  const params = useSearchParams();
  const gameId = params.get('id') ?? '';

  const [game, setGame] = useState<GameState | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketIdx, setIdx] = useState(0);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [lastBall, setLastBall] = useState<number | null>(null);
  const [countdown, setCd] = useState<number | null>(null);
  const [winEvent, setWinEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [isDark, setIsDark] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const cdRef = useRef<NodeJS.Timeout | null>(null);

  // --- Voice Announcer Logic ---
  const announceNumber = (num: number) => {
    if (typeof window !== 'undefined' && localStorage.getItem('buna-sound') !== 'off') {
      const msg = new SpeechSynthesisUtterance(`Number ${num}`);
      msg.rate = 1.1;
      msg.pitch = 1;
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    // Theme Check
    const savedTheme = localStorage.getItem('buna-theme');
    setIsDark(savedTheme === 'dark');
    setSoundOn(localStorage.getItem('buna-sound') !== 'off');

    if (!gameId) return;
    Promise.all([getGame(gameId), getMyCard(gameId)])
      .then(([g, res]) => {
        setGame(g);
        setTickets(res.tickets || []);
        const nums = g.drawHistory.map((d: any) => d.number);
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

    const ch = pusher.subscribe(`private-game-${gameId}`);
    ch.bind('number-drawn', (d: { number: number }) => {
      setLastBall(d.number);
      setDrawn(prev => [...prev, d.number]);
      announceNumber(d.number); // <-- VOICEOVER
    });
    // ... (other binds)
    return () => pusher.unsubscribe(`private-game-${gameId}`);
  }, [gameId]);

  function startCd(secs: number) {
    setCd(secs);
    let s = secs;
    cdRef.current = setInterval(() => {
      s--; setCd(s);
      if (s <= 0) clearInterval(cdRef.current!);
    }, 1000);
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>PREPARING ARENA...</span></div>;

  return (
    <div className={`game-container ${isDark ? 'dark' : 'gold'}`}>
      {winEvent && <WinnerPopup winMode={winEvent.winMode} amount={winEvent.prizeAmount} onClose={() => setWinEvent(null)} />}

      <div className="game-hdr">
        <div className="hdr-left">
          <h1 className="room-title">Buna {game?.room.type}</h1>
          <div className="status-lbl">
             <span className="dot pulse"></span> LIVE DRAW
          </div>
        </div>
        <div className="prize-pill">
           <Trophy size={18} />
           <span>{Number(game?.totalPrize).toFixed(0)} ETB</span>
        </div>
      </div>

      <div className="game-body">
        {/* Drawn Ball Display */}
        {lastBall && (
          <div className="ball-master">
            <div className="ball-header">
               <Volume2 size={14} className={soundOn ? 'active' : 'muted'} />
               <span>Now Calling</span>
            </div>
            <div className="ball-main">{lastBall}</div>
            <div className="recent-row">
              {drawn.slice(-5).reverse().map(n => <div key={n} className="ball-mini">{n}</div>)}
            </div>
          </div>
        )}

        {/* Countdown */}
        {game?.status === 'COUNTDOWN' && countdown !== null && (
          <div className="cd-overlay">
            <div className="cd-title">Game Starts In</div>
            <div className="cd-big">{countdown}</div>
            <Clock size={24} />
          </div>
        )}

        {/* Card Switcher */}
        {tickets.length > 1 && (
          <div className="switcher">
            {tickets.map((_, i) => (
              <button key={i} className={`sw-btn ${activeTicketIdx === i ? 'on' : ''}`} onClick={() => setIdx(i)}>
                Card {i+1}
              </button>
            ))}
          </div>
        )}

        <div className="card-container">
           <div className="card-top">
              <Target size={16} /> <span>CARD #{activeTicketIdx + 1}</span>
           </div>
           <BingoCard card={tickets[activeTicketIdx]?.card} drawnNumbers={drawn} />
        </div>
      </div>

      <Navbar />

      
    </div>
  );
}

