'use client';
import React, { useEffect, useState } from 'react';
import { getRooms, getWallet, getMe } from '../lib/api';
import { initTelegram } from '../lib/telegram';
import { useRouter } from 'next/navigation';
import { Trophy, Gift, Wallet as WalletIcon, Target, Play, Dices, ExternalLink, ShieldCheck, Home, Trophy as Scores, History, Wallet, User, ChevronDown, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Coffee & Gold Theme ──────────────────────────────────────────────
const T = {
  bg:      '#9B89B3',   // Lavender (from image)
  header:  '#3D2B1F',   // Dark coffee
  gold:    '#D4AF37',   // Gold
  goldDk:  '#B8860B',   // Deep gold
  brown:   '#8D6E63',   // Warm brown
  card:    '#FFFFFF',
  statBg:  '#EEDCBA',
};

interface Room {
  id: string;
  type: string;
  price: number;
  win: number;
  players: number;
  active: number;
  isBonus?: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initTelegram();
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    try {
      const me = await getMe();
      setUser(me);
      getWallet().then(setWallet);
      getRooms().then(setRooms);

      if (me.tickets && me.tickets.length > 0) {
         const latestTicket = me.tickets[0];
         if (latestTicket.game.status !== 'FINISHED' && latestTicket.game.status !== 'CANCELLED') {
            setActiveGame(latestTicket.game);
         } else {
            setActiveGame(null);
         }
      }
    } catch (e) {}
  };

  const handleJoinRoom = (room: any) => {
    router.push(`/tickets/select?type=${room.type}&price=${room.price}`);
  };

  const goToActiveGame = () => {
    if (!activeGame) return;
    if (activeGame.room.type.startsWith('SPIN_')) {
      router.push(`/play/spin?id=${activeGame.id}`);
    } else {
      router.push(`/game?id=${activeGame.id}`);
    }
  };

  if (!mounted) return null;

  const bingoRooms = rooms.filter(r => !r.type.startsWith('SPIN_') && r.type !== 'DEMO').map(r => ({
    id: r.id,
    type: r.type,
    price: Number(r.ticketPrice),
    win: r.games?.[0]?.totalPrize || Number(r.ticketPrice) * 8,
    players: r.games?.[0]?.tickets?.length || 0,
    active: r.games?.filter((g: any) => g.status === 'RUNNING').length || 0,
    isBonus: ['CASUAL', 'JACKPOT'].includes(r.type)
  }));

  const spinRooms = rooms.filter(r => r.type.startsWith('SPIN_')).map(r => ({
    id: r.id,
    type: r.type,
    price: Number(r.ticketPrice),
    win: r.games?.[0]?.totalPrize || 0,
    players: r.games?.[0]?.tickets?.length || 0,
    active: r.games?.filter((g: any) => g.status === 'RUNNING').length || 0,
    isBonus: r.type === 'SPIN_10' || r.type === 'SPIN_100'
  }));

  const demoRoom = rooms.find(r => r.type === 'DEMO');

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Top App Bar ── */}
      <div style={{ background: 'white', padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <X size={24} color="#333" />
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#333' }}>Addis Game Zone</div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <ChevronDown size={24} color="#333" />
            <MoreVertical size={24} color="#333" />
         </div>
      </div>

      {/* ── Sub-Header: Live & Wallet ── */}
      <div style={{ background: '#9B89B3', padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>
            <div style={{ width: '8px', height: '8px', background: '#4CAF50', borderRadius: '50%' }} />
            Live
         </div>
         <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D4AF37', fontSize: '13px', fontWeight: '900' }}>
               <Gift size={16} color="#D4AF37" /> Bonus: <span style={{ color: 'white' }}>0.00</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontSize: '13px', fontWeight: '900' }}>
               <WalletIcon size={16} color="#4CAF50" /> Balance: <span style={{ color: 'white' }}>{Number(wallet?.balance || 0).toFixed(2)}</span>
            </div>
         </div>
      </div>

      <div className="lobby-content" style={{ paddingTop: '15px' }}>
        
        {/* Active Game Banner */}
        <AnimatePresence>
          {activeGame && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onClick={goToActiveGame}
              style={{ background: '#D4AF37', color: '#3D2B1F', padding: '12px 15px', margin: '0 15px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(212,175,55,0.4)', cursor: 'pointer', fontWeight: '900' }}
            >
               <div style={{ fontSize: '13px' }}>🎯 YOU HAVE AN ACTIVE GAME! CLICK TO JOIN</div>
               <ExternalLink size={18} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BINGO GAMES Section ── */}
        <div style={{ padding: '0 15px' }}>
          <div style={{ color: 'white', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>
            <Target size={18} color="#D32F2F" /> BINGO GAMES
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', padding: '0 10px 8px', letterSpacing: '0.5px' }}>
             <span>BET</span>
             <span style={{ textAlign: 'center' }}>WIN/PLAYER</span>
             <span style={{ textAlign: 'right' }}>STATUS & JOIN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {bingoRooms.map((room) => (
              <React.Fragment key={room.type}>
                <div onClick={() => handleJoinRoom(room)} style={{ background: '#9B89B3', padding: '15px 10px', display: 'grid', gridTemplateColumns: '80px 1fr 120px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{room.price}</div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>ETB</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Trophy size={22} color="#D4AF37" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#D4AF37', lineHeight: '1' }}>{room.win}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{room.players} players</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <div style={{ background: '#4A90E2', color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>ACTIVE {room.active}</div>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <div style={{ border: '1px solid #4CAF50', color: '#4CAF50', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '900' }}>READY</div>
                            <div style={{ position: 'relative' }}>
                                <button style={{ background: '#2ECC71', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', boxShadow: '0 3px 0 #1E8449' }}>JOIN</button>
                                {room.isBonus && (
                                    <div style={{ position: 'absolute', top: '-12px', right: '-8px', background: '#D4AF37', color: '#3D2B1F', fontSize: '8px', padding: '2px 6px', borderRadius: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 5 }}>
                                        <Gift size={8} /> BONUS
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', color: 'white', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    JACKPOT {room.price === 10 ? '508' : '0'} / 1000
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* ── DEMO Row ── */}
          <div style={{ background: '#9B89B3', padding: '15px 10px', display: 'grid', gridTemplateColumns: '100px 1fr 120px', alignItems: 'center', marginTop: '2px' }}>
              <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', lineHeight: '1' }}>FREE</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>DEMO</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Play size={20} fill="white" color="white" />
                  <div>
                      <div style={{ fontWeight: '900', fontSize: '13px', color: 'white' }}>Practice Mode</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>No real money</div>
                  </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' }}>OPEN</button>
                  <button onClick={() => router.push('/tickets/select?type=DEMO&price=0')} style={{ background: '#666', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' }}>TRY</button>
              </div>
          </div>
        </div>

        {/* ── SPIN GAMES Section ── */}
        <div style={{ padding: '25px 15px 0' }}>
          <div style={{ color: 'white', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '18px' }}>🎰</span> SPIN GAMES
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', padding: '0 10px 8px' }}>
             <span>BET</span>
             <span style={{ textAlign: 'center' }}>WIN/PLAYER</span>
             <span style={{ textAlign: 'right' }}>STATUS & JOIN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {spinRooms.map((room) => (
              <React.Fragment key={room.type}>
                <div onClick={() => handleJoinRoom(room)} style={{ background: '#9B89B3', padding: '15px 10px', display: 'grid', gridTemplateColumns: '80px 1fr 120px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{room.price}</div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>ETB</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Trophy size={22} color="#D4AF37" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#D4AF37', lineHeight: '1' }}>0</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>0 players</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <div style={{ background: '#4A90E2', color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>ACTIVE {room.active}</div>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <div style={{ border: '1px solid #4CAF50', color: '#4CAF50', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '900' }}>READY</div>
                            <div style={{ position: 'relative' }}>
                                <button style={{ background: '#9B59B6', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', boxShadow: '0 3px 0 #8E44AD' }}>JOIN</button>
                                {room.isBonus && (
                                    <div style={{ position: 'absolute', top: '-12px', right: '-8px', background: '#D4AF37', color: '#3D2B1F', fontSize: '8px', padding: '2px 6px', borderRadius: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 5 }}>
                                        <Gift size={8} /> BONUS
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Navbar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.05)', zIndex: 1000 }}>
         {[
           { label: 'Game', icon: <Play size={20} fill="#4285F4" color="#4285F4" />, active: true },
           { label: 'Scores', icon: <Scores size={20} />, active: false },
           { label: 'History', icon: <History size={20} />, active: false },
           { label: 'Wallet', icon: <Wallet size={20} />, active: false },
           { label: 'Profile', icon: <User size={20} />, active: false },
         ].map((item) => (
           <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: item.active ? '#4285F4' : '#999', cursor: 'pointer' }}>
             {item.icon}
             <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{item.label}</span>
           </div>
         ))}
      </div>

      <style jsx global>{`
        body { background: #9B89B3 !important; }
      `}</style>
    </div>
  );
}
