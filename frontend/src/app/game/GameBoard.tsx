'use client';
import { useEffect, useState, useRef } from 'react';
import { getGame, getMyCard, pusherAuth } from '../../lib/api';
import Pusher from 'pusher-js';
import { Trophy, Star, RefreshCw, LogOut } from 'lucide-react';

interface GameBoardProps {
  gameId: string;
  onExit: () => void;
}

export default function GameBoard({ gameId, onExit }: GameBoardProps) {
  const [game, setGame] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const pusherRef = useRef<Pusher | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
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

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.error('Pusher configuration missing!');
      return;
    }

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
    });

    channel.bind('number-drawn', (data: { number: number }) => {
      setLastDrawn(data.number);
      setDrawnHistory(prev => [...prev, data.number]);
      setCountdown(null);
    });

    channel.bind('game-finished', (data: { winners: any[] }) => {
      setWinners(data.winners);
      setIsGameFinished(true);
    });

    pusherRef.current = pusher;
    return () => {
      if (pusherRef.current) pusherRef.current.unsubscribe(`private-game-${gameId}`);
    };
  }, [gameId]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
      }, 1000);
    } else {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    }
    return () => { if (countdownInterval.current) clearInterval(countdownInterval.current); };
  }, [countdown]);

  const isMarked = (num: number) => drawnHistory.includes(num);
  const columns = [
    { label: 'B', color: '#f97316', range: [1, 15] },
    { label: 'I', color: '#22c55e', range: [16, 30] },
    { label: 'N', color: '#3b82f6', range: [31, 45] },
    { label: 'G', color: '#ef4444', range: [46, 60] },
    { label: 'O', color: '#a855f7', range: [61, 75] },
  ];

  return (
    <div className="game-board-view">
      <div className="top-info">
         <div className="p">POOL: {(game?.totalPrize || 0).toFixed(0)}</div>
         <div className="p">PLAYERS: {game?.currentPlayers || 0}</div>
         <div className="p">CALLS: {drawnHistory.length}</div>
      </div>

      <div className="center-stage">
         <div className="call-box">
            <div className="l">LAST CALL</div>
            <div className="v">{lastDrawn || '-'}</div>
            <div className="cd">{countdown !== null ? `STARTING IN ${countdown}` : ''}</div>
         </div>
      </div>

      <div className="cards-stack">
         {tickets.map((t, idx) => (
            <div key={t.id} className="game-card">
               <div className="card-header">
                  {columns.map(c => <span key={c.label} style={{color:c.color}}>{c.label}</span>)}
               </div>
                <div className="card-grid">
                   {t.card && t.card.rows ? t.card.rows.map((row:any[], ri:number) => row.map((n:any, ci:number) => (
                     <div key={`${ri}-${ci}`} className={`c-cell ${n==='FREE'?'free':(isMarked(n)?'marked':'')}`}>
                        {n==='FREE' ? <Star size={10} fill="#D4AF37" /> : n}
                     </div>
                   ))) : <div className="loading-card">Loading...</div>}
                </div>
            </div>
         ))}
      </div>

      <div className="bottom-nav">
         <button className="btn-exit" onClick={onExit}><LogOut size={18} /> LEAVE</button>
      </div>

      {isGameFinished && (
        <div className="finish-overlay">
           <Trophy size={60} color="#D4AF37" />
           <h2>WINNERS!</h2>
           {winners.map((w,i) => <div key={i} className="winner">{w.user?.firstName}</div>)}
           <button className="btn-back" onClick={onExit}>BACK TO LOBBY</button>
        </div>
      )}

      
    </div>
  );
}

