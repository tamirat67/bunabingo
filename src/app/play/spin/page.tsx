'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { getMe, getGame, pusherAuth } from '../../../lib/api';
import Pusher from 'pusher-js';

// ─── Color Palette from Screenshot ──────────────────────────────────────────
const PALETTE = [
  '#4A90E2', // Blue
  '#5C6BC0', // Indigo
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#F44336', // Red
  '#FF9800', // Orange
  '#FFC107', // Gold
  '#4CAF50', // Green
];

// ─── Wheel SVG ────────────────────────────────────────────────────────────────
function PrizeWheel({ segments, sliceDeg }: { segments: any[], sliceDeg: number }) {
  const cx = 200, cy = 200, r = 190, labelR = 145;

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>
      <defs>
        <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2D1B14" />
          <stop offset="90%" stopColor="#3D2B1F" />
          <stop offset="100%" stopColor="#D4AF37" />
        </radialGradient>
      </defs>

      {/* Outer Border */}
      <circle cx={cx} cy={cy} r={r + 5} fill="#1a1a1a" stroke="#D4AF37" strokeWidth={4} />

      {/* Decorative dots on rim */}
      {Array.from({ length: 24 }).map((_, i) => {
        const deg = (i / 24) * 360;
        const x = cx + (r + 1) * Math.cos((deg * Math.PI) / 180);
        const y = cy + (r + 1) * Math.sin((deg * Math.PI) / 180);
        return <circle key={i} cx={x} cy={y} r={3} fill={i % 2 === 0 ? "#ffd700" : "#fff"} />;
      })}

      {segments.map((seg, i) => {
        const start = i * sliceDeg - 90;
        const end = start + sliceDeg;
        const midDeg = start + sliceDeg / 2;
        const midRad = (midDeg * Math.PI) / 180;
        const lx = cx + labelR * Math.cos(midRad);
        const ly = cy + labelR * Math.sin(midRad);
        const textAngle = midDeg + 90;

        return (
          <g key={i}>
            <path
              d={slicePath(cx, cy, r, start, end)}
              fill={seg.color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
            />
            <text
              x={lx} y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={18}
              fontWeight="900"
              transform={`rotate(${textAngle}, ${lx}, ${ly})`}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '-1px' }}
            >
              {seg.label}
            </text>
          </g>
        );
      })}

      {/* Center Hub (BUNA BINGO SPIN) */}
      <circle cx={cx} cy={cy} r={55} fill="url(#hubGrad)" stroke="#ffd700" strokeWidth={3} />
      <g transform={`translate(${cx - 35}, ${cy - 35}) scale(0.7)`}>
         <rect width="100" height="100" rx="50" fill="transparent" />
         <text x="50" y="40" textAnchor="middle" fill="#D4AF37" fontSize="14" fontWeight="bold">BUNA BINGO</text>
         <text x="50" y="65" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="black">SPIN</text>
         <text x="50" y="85" textAnchor="middle" fill="#D4AF37" fontSize="12">ቡና ቢንጎ</text>
      </g>
    </svg>
  );
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function SpinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stake = parseInt(searchParams.get('stake') || '10', 10);
  const gameId = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<null | { winnerCardId: number; prizeAmount: string }>(null);
  const [showResult, setShowResult] = useState(false);
  const [dynamicSegments, setDynamicSegments] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const totalSpun = useRef(0);

  useEffect(() => {
    getMe().then(setUser);
    if (!gameId) return;

    // Initial Load
    getGame(gameId).then(g => {
      setGame(g);
      setPlayerCount(g.tickets?.length || 0);
      if (g.status === 'COUNTDOWN') setCountdown(g.countdownSeconds);
      
      // If already finished (e.g. joined late), don't wait
      if (g.status === 'FINISHED' && g.winners?.length) {
         setResult({ winnerCardId: g.winners[0].ticket?.card?.id || 1, prizeAmount: g.winners[0].prizeAmount });
         setShowResult(true);
      }
    });

    // Pusher Sync
    let pusher: any = null;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (pusherKey && pusherCluster) {
      pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authorizer: (channel: any) => ({
          authorize: (socketId: string, cb: any) => {
            pusherAuth(socketId, channel.name).then(data => cb(null, data)).catch(err => cb(err, null));
          }
        })
      });

      const channel = pusher.subscribe(`private-game-${gameId}`);

      channel.bind('player-joined', (data: any) => {
        setPlayerCount(data.playerCount);
      });

      channel.bind('countdown-start', (data: { seconds: number }) => {
        setCountdown(data.seconds);
      });

      channel.bind('spin-result', (data: { winnerCardId: number; prizeAmount: string; soldCards: number[] }) => {
        setCountdown(null);
        handleRaffleResult(data);
      });
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe(`private-game-${gameId}`);
        pusher.disconnect();
      }
    };
  }, [gameId]);

  const handleRaffleResult = (data: { winnerCardId: number; prizeAmount: string; soldCards: number[] }) => {
    const sold = data.soldCards || [];
    let segmentsToDisplay = sold.map((cardId, i) => ({
      label: `${cardId}`,
      cardId,
      color: PALETTE[i % PALETTE.length],
      textColor: '#ffffff'
    }));

    // Repeat segments to make a full wheel (min 16 segments)
    while (segmentsToDisplay.length < 16 && segmentsToDisplay.length > 0) {
      segmentsToDisplay = [...segmentsToDisplay, ...segmentsToDisplay.map((s, idx) => ({
          ...s,
          color: PALETTE[(segmentsToDisplay.length + idx) % PALETTE.length]
      }))];
    }
    segmentsToDisplay = segmentsToDisplay.slice(0, 24);

    setDynamicSegments(segmentsToDisplay);
    setSpinning(true);

    const TOTAL_SEG = segmentsToDisplay.length;
    const SLICE = 360 / TOTAL_SEG;
    const winIdx = segmentsToDisplay.findIndex(s => s.cardId === data.winnerCardId);
    
    if (winIdx !== -1) {
      const segCenter = winIdx * SLICE + SLICE / 2;
      const extraSpins = 360 * (10 + Math.floor(Math.random() * 5)); 
      const targetAngle = totalSpun.current - segCenter - 90 + extraSpins;
      totalSpun.current = targetAngle % 360;

      const wheelEl = document.getElementById('prize-wheel-inner');
      if (wheelEl) {
        wheelEl.style.transition = 'transform 6s cubic-bezier(0.15, 0.8, 0.1, 1)';
        wheelEl.style.transform = `rotate(${targetAngle}deg)`;
      }

      setTimeout(() => {
        setResult({ winnerCardId: data.winnerCardId, prizeAmount: data.prizeAmount });
        setSpinning(false);
        setShowResult(true);
        getMe().then(setUser);
      }, 6500);
    }
  };

  const SLICE_DEG = dynamicSegments.length > 0 ? 360 / dynamicSegments.length : 36;

  return (
    <div className="selection-container brown" style={{ minHeight: '100vh', background: '#1A1A1A' }}>
      <div className="selection-header-top" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
        <button className="btn-back" onClick={() => router.push('/')}><ArrowLeft size={20} /></button>
        <div className="header-text">
          <h1 style={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px' }}>Raffle Draw</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>ROOM #{gameId?.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <div className="stats-row-brown" style={{ marginTop: '20px', padding: '0 20px' }}>
        <div className="capsule-brown" style={{ flex: 1 }}><div className="l">BALANCE</div><div className="v">{Number(user?.wallet?.balance || 0).toFixed(0)}</div></div>
        <div className="capsule-brown" style={{ flex: 1 }}><div className="l">TICKETS</div><div className="v">{playerCount} / 2 MIN</div></div>
      </div>

      <div className="wheel-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
         <div style={{ position: 'relative', width: '340px', height: '340px', transition: 'all 0.3s' }}>
            {/* The Pointer */}
            <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
                <svg width="40" height="50" viewBox="0 0 40 50">
                    <path d="M20 50 L0 0 L40 0 Z" fill="#F44336" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="20" cy="15" r="5" fill="#ffffff" />
                </svg>
            </div>

            <div id="prize-wheel-inner" style={{ width: '100%', height: '100%' }}>
               {dynamicSegments.length > 0 ? (
                 <PrizeWheel segments={dynamicSegments} sliceDeg={SLICE_DEG} />
               ) : (
                 <div className="wheel-placeholder" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #2D1B14 0%, #1A1A1A 100%)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <RefreshCw className="animate-spin" size={48} color="#D4AF37" style={{ margin: '0 auto 10px' }} />
                        <div style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 'bold' }}>WAITING...</div>
                    </div>
                 </div>
               )}
            </div>
         </div>

         <div className="spin-actions" style={{ marginTop: '40px', width: '100%', maxWidth: '300px', padding: '0 20px' }}>
            {countdown !== null ? (
              <div className="countdown-box" style={{ textAlign: 'center', padding: '24px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '24px', border: '2px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ color: '#D4AF37', fontSize: '12px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>DRAW STARTS IN</div>
                <div style={{ color: 'white', fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>{countdown}</div>
              </div>
            ) : spinning ? (
              <div style={{ textAlign: 'center' }}>
                 <div style={{ color: '#D4AF37', fontWeight: '900', fontSize: '24px', letterSpacing: '4px', textShadow: '0 0 10px #D4AF37' }}>ROULING...</div>
                 <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>Picking a winner among {playerCount} cards</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ color: '#D4AF37', fontWeight: '800', fontSize: '14px' }}>WAITING FOR CARDS</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>System automatically rolls when 2+ cards are sold.</div>
              </div>
            )}
         </div>
      </div>

      <AnimatePresence>
        {showResult && result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="win-overlay"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}
          >
             <motion.div 
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="win-card" 
                style={{ background: '#1A1A1A', border: '3px solid #D4AF37', borderRadius: '32px', padding: '40px 20px', textAlign: 'center', width: '100%', maxWidth: '340px', boxShadow: '0 0 50px rgba(212,175,55,0.3)' }}
             >
                <div style={{ fontSize: '80px', marginBottom: '10px' }}>{result.winnerCardId === (game?.tickets?.[0]?.card?.id || -1) ? '🎉' : '🍀'}</div>
                <h2 style={{ color: '#D4AF37', fontSize: '32px', fontWeight: '900', marginBottom: '5px' }}>
                  CARD #{result.winnerCardId}
                </h2>
                <div style={{ background: '#D4AF37', color: '#1A1A1A', display: 'inline-block', padding: '4px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '18px', marginBottom: '25px' }}>
                  WINNER!
                </div>
                
                <div style={{ marginBottom: '35px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>PRIZE AMOUNT</div>
                    <div style={{ color: 'white', fontSize: '36px', fontWeight: '900' }}>{Number(result.prizeAmount).toFixed(0)} <span style={{fontSize:'16px'}}>ETB</span></div>
                </div>

                <button 
                    onClick={() => router.push('/')} 
                    className="btn-bingo-main" 
                    style={{ background: '#D4AF37', color: '#1A1A1A', fontWeight: '900', height: '55px', borderRadius: '16px', boxShadow: '0 6px 0 #8B6B1D' }}
                >
                    BACK TO LOBBY
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SpinPage() {
  return (
    <Suspense fallback={<div className="selection-container brown" style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#D4AF37'}}>Loading Draw...</div>}>
      <SpinContent />
    </Suspense>
  );
}
