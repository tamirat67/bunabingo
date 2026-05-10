'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getGame, getMyCard, pusherAuth, claimBingo } from '../../lib/api';
import Pusher from 'pusher-js';
import { Volume2, VolumeX, RefreshCw, LogOut, Plus, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Coffee & Gold Theme ──────────────────────────────────────────────
const T = {
  bg:      '#F5E6BE',   // Cream
  header:  '#3D2B1F',   // Dark coffee
  gold:    '#D4AF37',   // Gold
  goldDk:  '#8B6B1D',   // Deep gold
  brown:   '#8D6E63',   // Warm brown
  statBg:  '#EEDCBA',
  card:    '#FFFFFF',
};

const COL_COLOR: Record<string, string> = {
  B: '#E74C3C', I: '#E67E22', N: '#D4AF37', G: '#27AE60', O: '#8E44AD',
};
const COL_RANGES = [
  { l: 'B', s: 1,  e: 15 },
  { l: 'I', s: 16, e: 30 },
  { l: 'N', s: 31, e: 45 },
  { l: 'G', s: 46, e: 60 },
  { l: 'O', s: 61, e: 75 },
];
function colLabel(n: number) {
  if (n <= 15) return 'B'; if (n <= 30) return 'I';
  if (n <= 45) return 'N'; if (n <= 60) return 'G'; return 'O';
}

function GameContent() {
  const router  = useRouter();
  const sp      = useSearchParams();
  const gameId  = sp.get('id');

  const [game,      setGame]      = useState<any>(null);
  const [tickets,   setTickets]   = useState<any[]>([]);
  const [drawn,     setDrawn]     = useState<number[]>([]);
  const [lastBall,  setLastBall]  = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundOn,   setSoundOn]   = useState(true);
  const [hidden,    setHidden]    = useState<Set<string>>(new Set());
  const [winMsg,    setWinMsg]    = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const [mounted,   setMounted]   = useState(false);

  const toastTimer = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    if (!gameId) return;

    const loadData = () => {
      Promise.all([getGame(gameId), getMyCard(gameId)]).then(([g, t]) => {
        setGame(g);
        setTickets(t.tickets || []);
        const hist = (g.drawHistory || []).map((d: any) => d.number);
        setDrawn(hist);
        setLastBall(hist.at(-1) ?? null);
        if (g.status === 'COUNTDOWN') setCountdown(g.countdownSeconds);
      }).catch(console.error);
    };

    loadData();

    const pk = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pc = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pk || !pc) return;
    const pusher = new Pusher(pk, {
      cluster: pc,
      authorizer: ch => ({ authorize: (sid, cb) => pusherAuth(sid, ch.name).then(d => cb(null, d)).catch(e => cb(e, null)) }),
    });
    const ch = pusher.subscribe(`private-game-${gameId}`);
    
    ch.bind('number-drawn', (d: { number: number }) => {
      const num = Number(d.number);
      setLastBall(num);
      setDrawn(p => [...p, num]);
      setCountdown(null);
      
      // Show Toast
      setToast(`${colLabel(num)} ${num}`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2500);

      if (soundOn && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(`${colLabel(num)} ${num}`);
        u.rate = 1.0; window.speechSynthesis.speak(u);
      }
    });

    ch.bind('countdown-start', (d: { seconds: number }) => setCountdown(d.seconds));
    ch.bind('game-update', (d: any) => {
      if (d.status === 'FINISHED') setWinMsg(d.winners?.[0] ? `Card #${(d.winners[0].ticket?.card as any)?.id} WON! 🏆` : 'Game Over');
      setGame((p: any) => p ? { ...p, ...d } : p);
    });

    return () => { ch.unbind_all(); pusher.disconnect(); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [gameId, mounted, soundOn]);

  const isCalled   = (n: number) => drawn.includes(n);
  const hideCard   = (id: string) => setHidden(p => new Set([...p, id]));
  const handleBingo = async (tid: string) => {
    if (!gameId) return;
    try { await claimBingo(gameId); }
    catch (e: any) { alert(e.response?.data?.error || 'No Bingo yet! Keep playing.'); }
  };

  if (!mounted) return null;

  const stake   = game?.room?.ticketPrice || 0;
  const prize   = stake * 8;
  const cdText  = countdown !== null ? `${countdown}s` : (game?.status === 'WAITING' ? 'WAIT' : 'LIVE');
  const visible = tickets.filter(t => !hidden.has(t.id));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Segoe UI', sans-serif", overflowX: 'hidden' }}>

      {/* ── Coffee Header ── */}
      <div style={{ background: T.header, padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `3px solid ${T.gold}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ color: T.gold, fontWeight: '900', fontSize: '18px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>☕</span> BUNA BINGO
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ background: game?.status === 'RUNNING' ? '#27AE60' : '#E67E22', color: 'white', fontSize: '10px', fontWeight: '900', padding: '3px 10px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
            {game?.status || 'LOADING'}
          </div>
          <div onClick={() => setSoundOn(!soundOn)} style={{ color: soundOn ? T.gold : T.brown, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.8)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            {soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px', background: T.statBg, borderBottom: `1px solid ${T.gold}44` }}>
        {[
          ['GAME ID', gameId?.slice(-6).toUpperCase() || '--'],
          ['PLAYERS', game?.currentPlayers ?? '-'],
          ['STAKE', `${stake} ETB`],
          ['CALLS', drawn.length]
        ].map(([l, v]) => (
          <div key={l as string} style={{ background: T.card, border: `1px solid ${T.gold}33`, padding: '6px 4px', textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: T.brown, marginBottom: '2px' }}>{l}</div>
            <div style={{ fontSize: '12px', fontWeight: '900', color: T.header }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Main 2-Column Layout ── */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px', alignItems: 'flex-start' }}>

        {/* ═══ LEFT COLUMN: Master Board ═══ */}
        <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Countdown + Last Ball */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, background: T.header, borderRadius: '14px', padding: '10px', textAlign: 'center', border: `2px solid ${T.gold}`, boxShadow: `0 4px 10px ${T.header}44` }}>
              <div style={{ color: T.gold, fontSize: '9px', fontWeight: '900', letterSpacing: '1px' }}>COUNT DOWN</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '900', lineHeight: 1 }}>{cdText}</div>
            </div>
            <motion.div
              key={lastBall}
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              style={{ width: '56px', height: '56px', background: lastBall ? COL_COLOR[colLabel(lastBall)] : T.statBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '22px', border: `4px solid ${T.gold}`, color: lastBall ? 'white' : T.brown, flexShrink: 0, boxShadow: lastBall ? `0 6px 15px ${COL_COLOR[colLabel(lastBall)]}66` : 'none' }}
            >
              {lastBall ?? '•'}
            </motion.div>
          </div>

          {/* Master Board Grid */}
          <div style={{ background: T.card, borderRadius: '14px', padding: '10px', border: `1px solid ${T.gold}44`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px', marginBottom: '6px' }}>
              {['B','I','N','G','O'].map(l => (
                <div key={l} style={{ background: COL_COLOR[l], color: 'white', textAlign: 'center', fontSize: '13px', fontWeight: '900', borderRadius: '6px', padding: '4px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{l}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' }}>
              {COL_RANGES.map(col =>
                Array.from({ length: 15 }, (_, i) => col.s + i).map(n => (
                  <div key={n} style={{
                    background: isCalled(n) ? COL_COLOR[col.l] : T.statBg,
                    color:      isCalled(n) ? 'white' : T.brown,
                    fontSize: '10px', fontWeight: '900', textAlign: 'center',
                    padding: '3.5px 0', borderRadius: '4px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: isCalled(n) ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                    transform: isCalled(n) ? 'scale(1.05)' : 'scale(1)',
                  }}>
                    {n}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => window.location.reload()} style={{ flex: 1, background: T.header, color: T.gold, border: `2px solid ${T.gold}`, padding: '12px', borderRadius: '14px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => router.push('/')} style={{ flex: 1, background: '#C0392B', color: 'white', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px #922B21' }}>
              <LogOut size={15} /> Leave
            </button>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: My Cartelas ═══ */}
        <div style={{ flex: 1, maxHeight: '82vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '4px' }} className="custom-scroll">
          <div style={{ color: T.header, fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: T.gold }}>🏆</span> YOUR CARTELAS ({visible.length})
             </div>
          </div>

          {visible.map((t: any) => {
            const cardObj  = t.card as { id: number; rows: any[][] };
            const rows     = cardObj?.rows ?? [];
            const cardId   = cardObj?.id ?? '?';
            const matched  = rows.flat().filter((c: any) => c !== 'FREE' && c !== 0 && c !== null && isCalled(Number(c))).length;

            return (
              <motion.div 
                layout
                key={t.id} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                style={{ position: 'relative', background: T.card, borderRadius: '16px', overflow: 'hidden', border: `2px solid ${T.gold}55`, boxShadow: '0 6px 15px rgba(61,43,31,0.1)' }}
              >
                {/* Hide Button */}
                <button onClick={() => hideCard(t.id)} style={{ position: 'absolute', top: '7px', right: '7px', width: '22px', height: '22px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <X size={12} />
                </button>

                {/* Card Top Bar */}
                <div style={{ background: T.header, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '35px' }}>
                  <div style={{ color: T.gold, fontWeight: '900', fontSize: '13px', letterSpacing: '0.5px' }}>CARTELA #{cardId}</div>
                  <div style={{ background: T.gold, color: T.header, fontSize: '10px', fontWeight: '900', padding: '3px 10px', borderRadius: '20px' }}>{matched} MATCHED</div>
                </div>

                {/* BINGO Column Labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px', padding: '6px 6px 0' }}>
                  {['B','I','N','G','O'].map(l => (
                    <div key={l} style={{ background: COL_COLOR[l], color: 'white', textAlign: 'center', fontSize: '11px', fontWeight: '900', padding: '3px 0', borderRadius: '5px' }}>{l}</div>
                  ))}
                </div>

                {/* Card Grid */}
                <div style={{ padding: '6px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                  {rows.map((row: any[], ri: number) =>
                    row.map((cell: any, ci: number) => {
                      const isFree   = cell === 'FREE' || cell === 0 || cell === null;
                      const isMarked = !isFree && isCalled(Number(cell));
                      return (
                        <div
                          key={`${ri}-${ci}`}
                          style={{
                            height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', fontSize: '14px', fontWeight: '900',
                            background: isFree ? '#27AE60' : isMarked ? T.gold : T.statBg,
                            color:      isFree ? 'white'   : T.header,
                            border:     isMarked ? `2px solid ${T.goldDk}` : '2px solid transparent',
                            boxShadow:  isMarked ? `0 2px 6px ${T.gold}66` : 'none',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {isFree ? '★' : cell}
                          {isMarked && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '50%' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* BINGO! Button */}
                <div style={{ padding: '0 6px 8px' }}>
                  <button
                    onClick={() => handleBingo(t.id)}
                    style={{ width: '100%', background: `linear-gradient(135deg, ${T.gold}, ${T.goldDk})`, color: T.header, border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', fontSize: '16px', boxShadow: `0 4px 0 ${T.goldDk}`, cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.1s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ☕ BINGO! ({prize} ETB)
                  </button>
                </div>
              </motion.div>
            );
          })}

          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', color: T.brown, padding: '40px 20px', background: T.card, borderRadius: '16px', border: `2px dashed ${T.gold}66`, fontSize: '14px' }}>
              <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '10px' }} />
              <div>Fetching your cards...</div>
            </div>
          )}
          <div style={{ height: '10px' }} />
        </div>
      </div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', background: T.header, color: T.gold, padding: '10px 25px', borderRadius: '30px', fontWeight: '900', fontSize: '20px', border: `2px solid ${T.gold}`, zIndex: 2000, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} fill={T.gold} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Add Board ── */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push(`/tickets/select?type=${game?.room?.type || 'STANDARD'}&price=${stake}`)}
        style={{ position: 'fixed', bottom: '90px', right: '15px', background: `linear-gradient(135deg, ${T.gold}, ${T.goldDk})`, color: T.header, padding: '14px 22px', borderRadius: '30px', fontWeight: '900', fontSize: '14px', boxShadow: '0 8px 20px rgba(61,43,31,0.35)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 200, cursor: 'pointer', border: `2px solid ${T.goldDk}` }}
      >
        <Plus size={20} strokeWidth={3} /> ADD BOARD
      </motion.div>

      {/* ── Win Overlay ── */}
      <AnimatePresence>
        {winMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(61,43,31,0.95)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }}
              style={{ background: T.card, border: `5px solid ${T.gold}`, borderRadius: '32px', padding: '45px 30px', textAlign: 'center', maxWidth: '320px', boxShadow: `0 0 60px ${T.gold}77` }}>
              <div style={{ fontSize: '70px', marginBottom: '10px' }}>☕</div>
              <h2 style={{ color: T.header, fontSize: '28px', fontWeight: '900', margin: '0 0 10px' }}>WINNER!</h2>
              <div style={{ color: T.header, fontSize: '20px', fontWeight: '900', margin: '0 0 30px', opacity: 0.8 }}>{winMsg}</div>
              <button onClick={() => router.push('/')}
                style={{ width: '100%', background: `linear-gradient(135deg, ${T.gold}, ${T.goldDk})`, color: T.header, border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: `0 5px 0 ${T.goldDk}` }}>
                BACK TO LOBBY
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #D4AF3744; border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#3D2B1F', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <RefreshCw size={48} color="#D4AF37" style={{ animation: 'spin 2s linear infinite' }} />
        <div style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>PREPARING BUNA BINGO...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
