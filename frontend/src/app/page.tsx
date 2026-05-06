'use client';
import { useEffect, useState } from 'react';
import { getRooms, getWallet, getMe, register, joinGame } from '../lib/api';
import Navbar from '../components/Navbar';
import Splash from '../components/Splash';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/Toast';
import { PREDEFINED_CARDS } from '../lib/predefinedCards';
import { 
  Target, Trophy, Play, Dices, Gift, Wallet, Zap, 
  ChevronLeft, RefreshCw, X, Star, LayoutGrid, CheckCircle2 
} from 'lucide-react';

interface Room {
  id: string;
  type: 'CASUAL' | 'STANDARD' | 'JACKPOT' | 'VIP';
  ticketPrice: string;
  currentPlayers: number;
}

export default function UnifiedLobbyPage() {
  // View Management
  const [view, setView] = useState<'LOBBY' | 'SELECT'>('LOBBY');
  
  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  
  // Selection State
  const [activeRoom, setActiveRoom] = useState<{type: string, price: number} | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [joining, setJoining] = useState(false);

  const router = useRouter();
  const { show } = useToast();

  const loadData = async (retryCount = 0) => {
    if (retryCount === 0) setLoading(true);
    try {
      let u = await getMe().catch(async (err) => {
        if (err.response?.status === 401) {
          const twa = (window as any).Telegram?.WebApp;
          const startParam = twa ? new URLSearchParams(twa.initData).get('start_param') : null;
          return await register({ phoneNumber: '', referredById: startParam || undefined });
        }
        throw err;
      });

      if (u) {
        setUser(u);
        const [r, w] = await Promise.all([getRooms(), getWallet()]);
        setRooms(r);
        setWallet(w);
      }
    } catch (err: any) {
      console.error('Data load failed', err);
      if (retryCount < 5) setTimeout(() => loadData(retryCount + 1), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const shown = sessionStorage.getItem('buna-splash-shown');
    if (!shown) setShowSplash(true);
  }, []);

  const handleOpenSelect = (type: string, price: number) => {
    setActiveRoom({ type, price });
    setSelectedCards([]);
    setView('SELECT');
    window.scrollTo(0, 0);
  };

  const handleToggleCard = (num: number) => {
    setSelectedCards(prev => {
      if (prev.includes(num)) return prev.filter(id => id !== num);
      if (prev.length < 3) return [...prev, num];
      return prev;
    });
  };

  const handleJoinGame = async () => {
    if (!activeRoom || selectedCards.length === 0 || joining) return;
    setJoining(true);
    try {
      const res = await joinGame(activeRoom.type, selectedCards);
      router.push(`/game?id=${res.gameId}`);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Join failed';
      show(errMsg, 'error');
    } finally {
      setJoining(false);
    }
  };

  const roomConfig = [
    { type: 'CASUAL', price: 10, label: 'Casual' },
    { type: 'STANDARD', price: 20, label: 'Standard' },
    { type: 'PRO', price: 50, label: 'Pro' },
    { type: 'JACKPOT', price: 100, label: 'Jackpot' },
  ];

  if (showSplash) {
    return <Splash isLoading={loading} onFinish={() => {
      setShowSplash(false);
      sessionStorage.setItem('buna-splash-shown', 'true');
    }} />;
  }

  return (
    <div className="buna-unified-container">
      {/* --- LOBBY VIEW --- */}
      {view === 'LOBBY' && (
        <div className="view-fade-in">
          <div className="lobby-nav-top">
            <div className="top-left">
              <span className="live-dot pulse"></span>
              <span className="live-txt">Live</span>
            </div>
            <div className="top-right">
              <div className="top-stat">
                <Gift size={16} className="gold-icon" />
                <span className="val yellow">0.00</span>
              </div>
              <div className="top-stat">
                <Wallet size={16} className="gold-icon" />
                <span className="val">{(wallet?.balance || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="section-header-simple">
            <Target size={18} className="icon-coffee" />
            <span>BINGO GAMES</span>
          </div>

          <div className="rooms-stack">
            {roomConfig.map((room, idx) => (
              <div key={`bingo-${room.type}`} className="room-item-wrapper">
                {idx > 0 && <div className="jackpot-divider">JACKPOT 0 / 1000</div>}
                <div className="room-row-simple">
                  <div className="col-bet-simple">
                    <div className="v">{room.price}</div>
                    <div className="l">ETB</div>
                    <div className="room-tag">{room.label}</div>
                  </div>
                  <div className="col-win-simple">
                    <Trophy size={20} className="trophy-gold" />
                    <div className="win-info">
                       <div className="v yellow">{room.price * 8}</div>
                       <div className="p">0 players</div>
                    </div>
                  </div>
                  <div className="col-action-simple">
                    <div className="badges-stack">
                      <div className="badge-active">ACTIVE 0</div>
                      <div className="badge-ready">READY</div>
                    </div>
                    <button className="btn-join-simple" onClick={() => handleOpenSelect(room.type, room.price)}>JOIN</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DEMO ROW */}
          <div className="demo-section-simple">
            <div className="jackpot-divider">JACKPOT 0 / 1000</div>
            <div className="demo-row-simple" onClick={() => handleOpenSelect('CASUAL', 0)}>
               <div className="demo-left"><div className="f">FREE</div><div className="d">DEMO</div></div>
               <div className="demo-mid">
                  <Play size={18} className="p-icon" />
                  <div className="m-info"><div className="t">Practice Mode</div><div className="s">No real money</div></div>
               </div>
               <div className="demo-right">
                  <button className="btn-try-mini">TRY</button>
               </div>
            </div>
          </div>

          <Navbar />
        </div>
      )}

      {/* --- SELECT VIEW --- */}
      {view === 'SELECT' && activeRoom && (
        <div className="view-fade-in">
          <div className="top-header-nav">
            <button className="btn-back-nav" onClick={() => setView('LOBBY')}>
              <ChevronLeft size={24} />
            </button>
            <div className="title-stack">
              <h1>Pick Cartelas</h1>
              <p>{activeRoom.type} • Stake {activeRoom.price}</p>
            </div>
          </div>

          <div className="stats-capsule-row">
            <div className="capsule wallet-capsule">
              <div className="l">Wallet</div>
              <div className="v">{(wallet?.balance || 0).toFixed(0)}</div>
            </div>
            <div className="capsule">
              <div className="l">Cards</div>
              <div className="v">{selectedCards.length} / 3</div>
            </div>
            <div className="capsule active-stake">
              <div className="l">Total</div>
              <div className="v">{selectedCards.length * activeRoom.price}</div>
            </div>
          </div>

          <div className="grid-scroll-area">
            <div className="cartela-100-grid">
              {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
                <div 
                  key={num} 
                  className={`cartela-item ${selectedCards.includes(num) ? 'chosen' : ''}`}
                  onClick={() => handleToggleCard(num)}
                >
                  {selectedCards.includes(num) && <CheckCircle2 size={10} className="check-badge" />}
                  {num}
                </div>
              ))}
            </div>
          </div>

          <div className="inline-action-zone">
             <div className="preview-column">
                {selectedCards.length > 0 ? (
                  <div className="patterns-horizontal-scroll">
                    {selectedCards.map((cardId) => (
                      <div key={cardId} className="inline-pattern-box">
                        <div className="pattern-label">#{cardId}</div>
                        <div className="pattern-mini-grid">
                          {PREDEFINED_CARDS[cardId]?.map((row, ri) => (
                            row.map((num, ci) => (
                              <div key={`${ri}-${ci}`} className={`mini-cell ${num === 0 ? 'free' : ''}`}>
                                {num === 0 ? <Star size={8} fill="#C98A1A" color="#C98A1A" /> : num}
                              </div>
                            ))
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-preview-box"><span>Pick up to 3 cards</span></div>
                )}
             </div>
             <div className="actions-column">
                <button 
                  className={`btn-start-inline ${(joining || selectedCards.length === 0) ? 'locked' : ''}`}
                  onClick={handleJoinGame}
                  disabled={joining || selectedCards.length === 0}
                >
                  <Play size={18} />
                  <span>{joining ? '...' : 'JOIN'}</span>
                </button>
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .buna-unified-container { min-height: 100vh; background: #F5ECD7; padding-bottom: 100px; font-family: sans-serif; }
        .view-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .lobby-nav-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #5C3D1E; color: white; }
        .top-left { display: flex; align-items: center; gap: 6px; }
        .live-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; }
        .live-txt { font-size: 12px; font-weight: 800; opacity: 0.8; }
        .pulse { animation: pulse 2s infinite; }
        .top-right { display: flex; gap: 15px; }
        .top-stat { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 900; }
        .gold-icon { color: #facc15; }
        .yellow { color: #facc15; }

        .section-header-simple { padding: 20px 16px 10px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: #C98A1A; }
        .room-row-simple { display: grid; grid-template-columns: 80px 1fr 120px; padding: 16px; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); background: white; }
        .col-bet-simple .v { font-size: 28px; font-weight: 900; color: #5C3D1E; }
        .col-bet-simple .l { font-size: 10px; opacity: 0.6; }
        .room-tag { font-size: 9px; font-weight: 900; color: #C98A1A; margin-top: 4px; }
        .col-win-simple { display: flex; align-items: center; gap: 10px; padding: 0 10px; }
        .win-info .v { font-size: 20px; font-weight: 900; }
        .win-info .p { font-size: 10px; opacity: 0.5; }
        .trophy-gold { color: #D4AF37; }
        .col-action-simple { display: flex; justify-content: flex-end; }
        .btn-join-simple { background: #22c55e; color: white; border: none; padding: 10px 18px; border-radius: 12px; font-weight: 900; box-shadow: 0 4px 0 #16a34a; cursor: pointer; }
        .btn-join-simple:active { transform: translateY(2px); box-shadow: none; }
        .jackpot-divider { background: #FFF0D0; color: #5C3D1E; font-size: 9px; font-weight: 900; text-align: center; padding: 4px; opacity: 0.8; }

        /* SELECT VIEW SPECIFIC */
        .top-header-nav { display: flex; align-items: center; padding: 16px; gap: 16px; background: #5C3D1E; color: white; }
        .btn-back-nav { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; }
        .title-stack h1 { font-size: 18px; font-weight: 900; margin: 0; }
        .title-stack p { font-size: 11px; opacity: 0.7; margin: 0; }
        .stats-capsule-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px; }
        .capsule { background: white; border-radius: 14px; padding: 10px 4px; text-align: center; border: 1.5px solid #EFE4CC; }
        .capsule.active-stake { border-color: #C98A1A; background: #5C3D1E; color: white; }
        .capsule .l { font-size: 8px; font-weight: 800; opacity: 0.5; margin-bottom: 2px; }
        .capsule .v { font-size: 15px; font-weight: 900; }
        .grid-scroll-area { padding: 0 12px; margin-bottom: 20px; }
        .cartela-100-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; }
        .cartela-item { aspect-ratio: 1; background: white; border: 1.5px solid #EFE4CC; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; position: relative; }
        .cartela-item.chosen { background: #C98A1A; color: white; border-color: #C98A1A; }
        .check-badge { position: absolute; top: -4px; right: -4px; color: #22c55e; background: white; border-radius: 50%; }

        .inline-action-zone { position: fixed; bottom: 0; left: 0; right: 0; background: #F5ECD7; border-top: 1px solid #EFE4CC; padding: 12px 16px 24px; display: grid; grid-template-columns: 1fr 100px; gap: 12px; }
        .preview-column { display: flex; overflow-x: auto; gap: 8px; }
        .inline-pattern-box { background: white; border: 1.5px solid #C98A1A; border-radius: 12px; padding: 6px; width: 80px; flex-shrink: 0; }
        .pattern-mini-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; }
        .mini-cell { aspect-ratio: 1; background: #F9F3E5; font-size: 6px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .mini-cell.free { background: #FFF0D0; }
        .btn-start-inline { background: #22c55e; color: white; border: none; border-radius: 10px; height: 100%; font-weight: 900; box-shadow: 0 5px 0 #16a34a; }
        .btn-start-inline.locked { opacity: 0.5; box-shadow: none; transform: translateY(2px); }

        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
