'use client';
import React, { useEffect, useState } from 'react';
import { getRooms, getWallet, getMe } from '../lib/api';
import { initTelegram } from '../lib/telegram';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { Trophy, Gift, Wallet as WalletIcon, Target, Play, Dices, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
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
    
    // Auto-refresh every 10 seconds to catch game status updates
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    const me = await getMe();
    setUser(me);
    getWallet().then(setWallet);
    getRooms().then(setRooms);

    // Find the most recent active/waiting game the user is in
    if (me.tickets && me.tickets.length > 0) {
       const latestTicket = me.tickets[0]; // Backend should sort by date
       if (latestTicket.game.status !== 'FINISHED' && latestTicket.game.status !== 'CANCELLED') {
          setActiveGame(latestTicket.game);
       } else {
          setActiveGame(null);
       }
    }
  };

  const handleJoinRoom = (room: Room) => {
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

  const bingoRooms: Room[] = [
    { type: 'DEMO', price: 0, win: 0, players: 0, active: 1, isBonus: true },
    { type: 'CASUAL', price: 10, win: 80, players: 0, active: 0, isBonus: true },
    { type: 'STANDARD', price: 20, win: 160, players: 0, active: 0 },
    { type: 'PRO', price: 50, win: 400, players: 0, active: 0 },
    { type: 'JACKPOT', price: 100, win: 800, players: 0, active: 0 },
  ];

  return (
    <div className="lobby-container" style={{ background: '#1A1A1A', minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="lobby-header-stats" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="live-box"><span className="dot-green animate-pulse"></span> Live Online</div>
        <div className="stats-group">
          <div className="stat"><WalletIcon size={14} color="#D4AF37" /> <span className="gold-text">{Number(wallet?.balance || 0).toFixed(0)} ETB</span></div>
        </div>
      </div>

      <div className="lobby-content" style={{ padding: '20px' }}>
        
        <AnimatePresence>
          {activeGame && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="active-game-banner"
              style={{ 
                background: 'linear-gradient(135deg, #3D2B1F 0%, #1A1A1A 100%)',
                border: '2px solid #D4AF37',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
               <div>
                  <div style={{ color: '#D4AF37', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>YOU HAVE AN ACTIVE GAME</div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>
                     {activeGame.room.type.replace('_', ' ')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Status: {activeGame.status}</div>
               </div>
               <button 
                onClick={goToActiveGame}
                className="btn-join-3d" 
                style={{ background: '#D4AF37', color: '#1A1A1A', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
               >
                 GO TO GAME <ExternalLink size={16} />
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="section-header" style={{ marginBottom: '15px' }}>
          <Target size={20} color="#D4AF37" /> <span className="title-gold" style={{ fontSize: '18px', fontWeight: '900' }}>BINGO ROOMS</span>
        </div>
        
        <div className="games-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bingoRooms.map((room) => {
            const isDemo = room.type === 'DEMO';
            return (
              <div key={room.type} className={`bingo-row-fit ${isDemo ? 'demo-style' : ''}`} onClick={() => handleJoinRoom(room)} style={{ background: '#2D1B14', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '16px', padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="bet-part">
                        <div className="num" style={{ fontSize: '24px', fontWeight: '900', color: '#D4AF37' }}>{room.price}</div>
                        <div className="unit" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>ETB</div>
                    </div>
                    <div className="prize-part" style={{ textAlign: 'center' }}>
                        <Trophy size={20} color="rgba(212,175,55,0.5)" />
                        <div className="val" style={{ color: 'white', fontWeight: '800' }}>{isDemo ? 'PRACTICE' : `${room.win} ETB`}</div>
                    </div>
                    <button className="btn-join-3d" style={{ height: '40px', padding: '0 20px', borderRadius: '10px' }}>JOIN</button>
                  </div>
              </div>
            );
          })}
        </div>

        <div className="section-header" style={{ marginTop: '30px', marginBottom: '15px' }}>
          <Dices size={20} color="#D4AF37" /> <span className="title-gold" style={{ fontSize: '18px', fontWeight: '900' }}>RAFFLE SPINS</span>
        </div>
        
        <div className="games-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[10, 20, 50, 100].map((stake) => (
            <div key={stake} className="bingo-row-fit" onClick={() => router.push(`/tickets/select?type=SPIN_${stake}&price=${stake}`)} style={{ background: '#2D1B14', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '16px', padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="bet-part">
                        <div className="num" style={{ fontSize: '24px', fontWeight: '900', color: '#D4AF37' }}>{stake}</div>
                        <div className="unit" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>ETB</div>
                    </div>
                    <div className="prize-part" style={{ textAlign: 'center' }}>
                        <Dices size={20} color="rgba(212,175,55,0.5)" />
                        <div className="val" style={{ color: 'white', fontWeight: '800' }}>RAFFLE</div>
                    </div>
                    <button className="btn-join-3d" style={{ height: '40px', padding: '0 20px', borderRadius: '10px', background: 'linear-gradient(to right, #8D6E63, #3D2B1F)' }}>SPIN</button>
                </div>
            </div>
          ))}
        </div>
      </div>
      <Navbar />
    </div>
  );
}
