'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getGame, getMyCard, pusherAuth } from '../../lib/api';
import Pusher from 'pusher-js';
import { Trophy, ChevronLeft, Volume2, VolumeX, Star, Zap, Users, Wallet, PlayCircle, RefreshCw, LogOut } from 'lucide-react';
import Navbar from '../../components/Navbar';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get('id');
  
  const [game, setGame] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const pusherRef = useRef<Pusher | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    if (!gameId) return;
    try {
      const [gData, tData] = await Promise.all([
        getGame(gameId),
        getMyCard(gameId)
      ]);
      setGame(gData);
      setTickets(tData.tickets || []);
      const history = gData.drawHistory.map((d: any) => d.number);
      setDrawnHistory(history);
      setLastDrawn(history.slice(-1)[0] || null);
      setWinners(gData.winners || []);
      if (gData.status === 'FINISHED') setIsGameFinished(true);
      if (gData.status === 'COUNTDOWN') setCountdown(gData.countdownSeconds);
    } catch (err) {
      console.error('Failed to load game data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Initialize Pusher — only if keys are available
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster || !gameId) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          pusherAuth(socketId, channel.name)
            .then(data => callback(null, data))
            .catch(err => callback(err, null));
        }
      })
    });

    const channel = pusher.subscribe(`private-game-${gameId}`);
    
    channel.bind('countdown-start', (data: { seconds: number }) => {
      setCountdown(data.seconds);
      setGame((prev: any) => ({ ...prev, status: 'COUNTDOWN' }));
    });

    channel.bind('number-drawn', (data: { number: number }) => {
      setLastDrawn(data.number);
      setDrawnHistory(prev => [...prev, data.number]);
      setGame((prev: any) => ({ ...prev, status: 'RUNNING' }));
      setCountdown(null);
      if (soundOn) playAnnouncer(data.number);
    });

    channel.bind('game-finished', (data: { winners: any[] }) => {
      setWinners(data.winners);
      setIsGameFinished(true);
    });

    pusherRef.current = pusher;

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`private-game-${gameId}`);
        pusherRef.current.disconnect();
      }
    };
  }, [gameId]);

  // Countdown timer logic
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
      }, 1000);
    } else if (countdown === 0) {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    }
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [countdown]);

  const playAnnouncer = (num: number) => {
    if (typeof window === 'undefined') return;
    const msg = new SpeechSynthesisUtterance(num.toString());
    msg.rate = 1.2;
    window.speechSynthesis.speak(msg);
  };

  const isMarked = (num: number) => drawnHistory.includes(num);

  const masterBoardNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
  const columns = [
    { label: 'B', color: '#f97316', range: [1, 15] },
    { label: 'I', color: '#22c55e', range: [16, 30] },
    { label: 'N', color: '#3b82f6', range: [31, 45] },
    { label: 'G', color: '#ef4444', range: [46, 60] },
    { label: 'O', color: '#a855f7', range: [61, 75] },
  ];

  return (
    <div className="pro-game-board">
      {/* Top Stats Bar */}
      <div className="pro-top-bar">
         <div className="stat-pill">
            <span className="l">Room</span>
            <span className="v">{gameId?.slice(-6).toUpperCase()}</span>
         </div>
         <div className="stat-pill">
            <span className="l">Pool</span>
            <span className="v">{(game?.totalPrize || 0).toFixed(0)}</span>
         </div>
         <div className="stat-pill">
            <span className="l">Players</span>
            <span className="v">{game?.currentPlayers || 0}</span>
         </div>
         <div className="stat-pill">
            <span className="l">Bet</span>
            <span className="v">{game?.room?.ticketPrice || 0}</span>
         </div>
         <div className="stat-pill">
            <span className="l">Call</span>
            <span className="v">{drawnHistory.length}</span>
         </div>
      </div>

      <div className="main-board-layout">
         {/* LEFT: MASTER BOARD */}
         <div className="master-board-column">
            <div className="master-header-row">
               {columns.map(c => <div key={c.label} className="h-cell" style={{ color: c.color }}>{c.label}</div>)}
            </div>
            <div className="master-numbers-grid">
               {columns.map(col => (
                 <div key={col.label} className="master-col">
                    {Array.from({ length: 15 }, (_, i) => col.range[0] + i).map(num => (
                      <div key={num} className={`m-cell ${isMarked(num) ? 'active' : ''}`}>
                         {num}
                      </div>
                    ))}
                 </div>
               ))}
            </div>
         </div>

         {/* RIGHT: ACTION ZONE */}
         <div className="action-column">
            <div className="action-top-row">
               <div className="countdown-box">
                  <div className="l">COUNT DOWN</div>
                  <div className="v">{countdown !== null ? countdown : (game?.status === 'WAITING' ? 'WAITING' : 'LIVE')}</div>
               </div>
               <div className="current-call-circle">
                  <div className="l">CURRENT CALL</div>
                  <div className="call-num">
                    {lastDrawn || '-'}
                    <div className="pulse-ring"></div>
                  </div>
               </div>
            </div>

            {/* USER CARDS STACK */}
            <div className="user-cards-scroll">
               {tickets.map((ticket, tIdx) => (
                 <div key={ticket.id} className="mini-card-wrapper">
                    <div className="mini-card-header">
                       {['B','I','N','G','O'].map((l, i) => (
                         <span key={l} style={{ color: columns[i].color }}>{l}</span>
                       ))}
                    </div>
                     <div className="mini-card-grid">
                        {ticket?.card?.rows ? ticket.card.rows.map((row: any[], ri: number) => (
                          row.map((num: any, ci: number) => (
                            <div key={`${ri}-${ci}`} className={`mini-cell ${num === 'FREE' ? 'free' : (isMarked(num) ? 'marked' : '')}`}>
                               {num === 'FREE' ? <Star size={10} fill="#D4AF37" color="#D4AF37" /> : num}
                            </div>
                          ))
                        )) : <div className="loading-card">Loading...</div>}
                     </div>
                    <div className="mini-card-footer">BOARD NUMBER {tIdx + 1}</div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="pro-bottom-actions">
         <button className="btn-bingo-main">BINGO!</button>
         <div className="aux-actions">
            <button className="btn-aux refresh" onClick={loadData}><RefreshCw size={20} /> Refresh</button>
            <button className="btn-aux leave" onClick={() => router.push('/')}><LogOut size={20} /> Leave</button>
         </div>
      </div>

      <Navbar />

      {/* WINNER OVERLAY */}
      {isGameFinished && (
        <div className="pro-overlay-winner">
          <div className="win-card">
             <Trophy size={60} className="trophy-gold" />
             <h2>GAME FINISHED</h2>
             <div className="winner-stack">
                {winners.map((w, i) => (
                  <div key={i} className="winner-item">
                     <span className="n">{w.user?.firstName || 'Winner'}</span>
                     <span className="a">🏆 WINNER</span>
                  </div>
                ))}
             </div>
             <button className="btn-back-home" onClick={() => router.push('/')}>BACK TO LOBBY</button>
          </div>
        </div>
      )}

      
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

