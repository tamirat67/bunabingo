'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getGame, getMyCard, pusherAuth } from '../../lib/api';
import Pusher from 'pusher-js';
import { Trophy, ChevronLeft, Volume2, VolumeX, MessageSquare, Star } from 'lucide-react';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get('id');
  
  const [game, setGame] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketIdx, setActiveTicketIdx] = useState(0);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);

  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!gameId) return;

    // Load initial game state
    const loadGame = async () => {
      try {
        const [gData, tData] = await Promise.all([
          getGame(gameId),
          getMyCard(gameId)
        ]);
        setGame(gData);
        setTickets(tData.tickets || []);
        setDrawnHistory(gData.drawHistory.map((d: any) => d.number));
        setLastDrawn(gData.drawHistory.slice(-1)[0]?.number || null);
        setWinners(gData.winners || []);
        if (gData.status === 'FINISHED') setIsGameFinished(true);

        // Load sound setting
        const savedSound = localStorage.getItem('buna-sound') !== 'off';
        setSoundOn(savedSound);

        // Initialize Pusher
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          authorizer: (channel) => ({
            authorize: (socketId, callback) => {
              pusherAuth(socketId, channel.name)
                .then(data => callback(null, data))
                .catch(err => callback(err, null));
            }
          })
        });

        const channel = pusher.subscribe(`private-game-${gameId}`);
        
        channel.bind('number-drawn', (data: { number: number }) => {
          setLastDrawn(data.number);
          setDrawnHistory(prev => [...prev, data.number]);
          if (soundOn) playAnnouncer(data.number);
        });

        channel.bind('game-won', (data: { winners: any[] }) => {
          setWinners(data.winners);
          setIsGameFinished(true);
        });

        pusherRef.current = pusher;
      } catch (err) {
        console.error('Failed to load game:', err);
      }
    };

    loadGame();

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`private-game-${gameId}`);
      }
    };
  }, [gameId, soundOn]);

  const playAnnouncer = (num: number) => {
    // Basic browser speech for now
    const msg = new SpeechSynthesisUtterance(num.toString());
    msg.rate = 1.1;
    window.speechSynthesis.speak(msg);
  };

  const isMarked = (num: number) => drawnHistory.includes(num);

  const activeTicket = tickets[activeTicketIdx];

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="btn-back" onClick={() => router.push('/')}>
          <ChevronLeft size={24} />
        </button>
        <div className="game-info">
           <div className="game-id">GAME ID: {gameId?.slice(-6).toUpperCase()}</div>
           <div className="room-name">{game?.room?.type} Room</div>
        </div>
        <button className="btn-sound" onClick={() => setSoundOn(!soundOn)}>
          {soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </div>

      <div className="announcer-panel">
        <div className="drawn-circle">
          <div className="num-main">{lastDrawn || '--'}</div>
          <div className="pulse-ring"></div>
        </div>
        <div className="drawn-history">
          {drawnHistory.slice(-5, -1).reverse().map((num, i) => (
            <div key={i} className="hist-num">{num}</div>
          ))}
        </div>
      </div>

      {/* TICKET SELECTOR (FOR MULTI-CARD) */}
      {tickets.length > 1 && (
        <div className="ticket-tabs">
          {tickets.map((_, i) => (
            <button 
              key={i} 
              className={`tab-btn ${activeTicketIdx === i ? 'active' : ''}`}
              onClick={() => setActiveTicketIdx(i)}
            >
              CARD {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="card-outer">
        <div className="card-inner">
          <div className="bingo-header">
            {['B','I','N','G','O'].map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="bingo-grid">
            {activeTicket?.numbers.map((row: any[], i: number) => (
              row.map((num: number, j: number) => (
                <div 
                  key={`${i}-${j}`} 
                  className={`bingo-cell ${num === 0 ? 'empty' : ''} ${isMarked(num) ? 'marked' : ''}`}
                >
                  {num === 0 ? <Star size={16} fill="#D4AF37" color="#D4AF37" /> : num}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      <div className="game-footer">
        <div className="stat-box">
          <div className="l">Active Players</div>
          <div className="v">{game?.tickets?.length || 0}</div>
        </div>
        <div className="stat-box">
          <div className="l">Prize Pool</div>
          <div className="v yellow">{(game?.room?.ticketPrice * 8 || 0)} ETB</div>
        </div>
      </div>

      {isGameFinished && (
        <div className="overlay-winner">
          <div className="win-content">
             <Trophy size={80} className="win-trophy" />
             <h2>GAME FINISHED</h2>
             <div className="winners-list">
                {winners.map((w, i) => (
                  <div key={i} className="win-row">
                    <span className="w-name">{w.user?.firstName || 'Winner'}</span>
                    <span className="w-amt">Win! 🏆</span>
                  </div>
                ))}
             </div>
             <button className="btn-back-lobby" onClick={() => router.push('/')}>BACK TO LOBBY</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .game-container { min-height: 100vh; background: var(--bg-main); color: var(--text-main); padding-bottom: 40px; transition: all 0.3s; }
        
        .game-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--bg-nav); color: white; }
        .btn-back, .btn-sound { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .game-info { text-align: center; }
        .game-id { font-size: 10px; opacity: 0.7; font-weight: 800; letter-spacing: 1px; }
        .room-name { font-size: 16px; font-weight: 900; }

        .announcer-panel { padding: 30px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .drawn-circle { width: 120px; height: 120px; background: #6F4E37; border-radius: 50%; border: 6px solid var(--gold-accent); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .num-main { font-size: 56px; font-weight: 900; color: white; z-index: 2; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 4px solid var(--gold-accent); animation: ringPulse 2s infinite; }
        @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }

        .drawn-history { display: flex; gap: 10px; min-height: 40px; }
        .hist-num { width: 34px; height: 34px; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; opacity: 0.5; border: 1px solid var(--border-light); }

        .ticket-tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }
        .tab-btn { background: var(--bg-card); border: 2px solid var(--border-light); color: var(--text-main); padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 12px; }
        .tab-btn.active { background: var(--gold-accent); border-color: var(--gold-accent); color: black; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3); }

        .card-outer { padding: 0 16px; }
        .card-inner { background: #FFF9E6; border-radius: 20px; padding: 12px; border: 4px solid #D4AF37; box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
        .theme-dark .card-inner { background: #1f2937; border-color: #4b5563; }
        
        .bingo-header { display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; font-size: 24px; font-weight: 900; color: #6F4E37; margin-bottom: 10px; }
        .theme-dark .bingo-header { color: #facc15; }
        
        .bingo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .bingo-cell { aspect-ratio: 1; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #4B3621; transition: 0.3s; border: 1px solid rgba(0,0,0,0.05); }
        .theme-dark .bingo-cell { background: #374151; color: #f3f4f6; border-color: #4b5563; }
        .bingo-cell.marked { background: #22c55e; color: white; border-color: #15803d; transform: scale(0.95); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
        .bingo-cell.empty { background: rgba(0,0,0,0.02); }

        .game-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 24px 16px; }
        .stat-box { background: var(--bg-card); padding: 16px; border-radius: 16px; text-align: center; border: 1px solid var(--border-light); }
        .stat-box .l { font-size: 10px; font-weight: 800; opacity: 0.5; text-transform: uppercase; margin-bottom: 4px; }
        .stat-box .v { font-size: 20px; font-weight: 900; }
        .yellow { color: #facc15; }

        .overlay-winner { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
        .win-content { text-align: center; color: white; padding: 40px; width: 100%; max-width: 400px; animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .win-trophy { color: #facc15; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.5)); }
        .win-content h2 { font-size: 28px; font-weight: 900; margin-bottom: 20px; letter-spacing: 2px; }
        .winners-list { margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px; }
        .win-row { background: rgba(255,255,255,0.1); padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
        .btn-back-lobby { width: 100%; background: #22c55e; color: white; border: none; padding: 18px; border-radius: 18px; font-weight: 900; font-size: 16px; cursor: pointer; box-shadow: 0 6px 0 #15803d; }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /><span>JOINING GAME...</span></div>}>
      <GameContent />
    </Suspense>
  );
}
