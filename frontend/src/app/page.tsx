'use client';
import { useEffect, useState } from 'react';
import { getRooms, getWallet, getMe, register } from '../lib/api';
import Navbar from '../components/Navbar';
import Splash from '../components/Splash';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/Toast';
import { initTelegram } from '../lib/telegram';
import { Target, Trophy, Play, Dices, Gift, Wallet, Zap, AlertCircle } from 'lucide-react';

interface Room {
  id: string;
  type: 'CASUAL' | 'STANDARD' | 'JACKPOT' | 'VIP';
  ticketPrice: string;
  currentPlayers: number;
}

// Global flag to ensure splash only shows once per session
let hasShownSplash = false;

export default function LobbyPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(!hasShownSplash);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const { show } = useToast();

  const loadData = async () => {
    try {
      // Step 1: Always load rooms (public endpoint - no auth needed)
      const r = await getRooms();
      setRooms(r);

      // Step 2: Try to authenticate and get wallet (may fail in browser/no Telegram)
      try {
        let u = await getMe();
        if (u) {
          const w = await getWallet();
          setWallet(w);
        }
      } catch (authErr: any) {
        if (authErr.response?.status === 401) {
          // Try auto-register for new Telegram users
          const twa = (window as any).Telegram?.WebApp;
          if (twa?.initData) {
            const startParam = new URLSearchParams(twa.initData || '').get('start_param');
            try {
              const u = await register({ phoneNumber: '', referredById: startParam || undefined });
              if (u) {
                const w = await getWallet();
                setWallet(w);
              }
            } catch (_) {
              // Registration failed silently - user sees lobby in guest mode
            }
          }
          // No Telegram context (Chrome) - just show lobby without wallet
        }
        // Any other auth error: silently ignore, show guest lobby
      }
      setAuthError(null);
    } catch (err: any) {
      console.error('Lobby load failed', err);
      // Rooms failed to load - show error
      setAuthError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTelegram(); // Critical: signals Telegram the app is ready & expands it
    loadData();
  }, []);

  const handleJoin = (type: string, price: number) => {
    const currentBalance = wallet?.balance || 0;
    if (currentBalance < price && type !== 'CASUAL_FREE') {
      show(`Insufficient Balance. Please top up to join the ${price} ETB room.`, 'error');
    }
    router.push(`/tickets/select?type=${type}&price=${price}`);
  };

  const roomConfig = [
    { type: 'CASUAL', price: 10, label: 'Casual' },
    { type: 'STANDARD', price: 20, label: 'Standard' },
    { type: 'PRO', price: 50, label: 'Pro' },
    { type: 'JACKPOT', price: 100, label: 'Jackpot' },
  ];

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '32px', textAlign: 'center', gap: '16px' }}>
        <AlertCircle size={52} color="#ef4444" />
        <h2 style={{ fontSize: '20px', fontWeight: 900 }}>Connection Error</h2>
        <p style={{ fontSize: '14px', opacity: 0.7, maxWidth: '280px', lineHeight: 1.6 }}>{authError}</p>
        <button onClick={() => { setAuthError(null); setLoading(true); loadData(); }} style={{ background: 'var(--bg-nav)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '14px', fontWeight: 900, fontSize: '16px', marginTop: '8px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      {showSplash && <Splash isLoading={loading} onFinish={() => {
        setShowSplash(false);
        hasShownSplash = true;
      }} />}
      
      <div className="lobby-nav-top">
        <div className="top-left">
           <span className="live-dot pulse"></span>
           <span className="live-txt">Live</span>
        </div>
        <div className="top-right">
           <div className="top-stat">
              <Gift size={16} className="gold-icon" />
              <span className="lbl">Bonus:</span>
              <span className="val yellow">0.00</span>
           </div>
           <div className="top-stat">
              <Wallet size={16} className="gold-icon" />
              <span className="lbl">Balance:</span>
              <span className="val">{(wallet?.balance || 0).toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="section-header-simple">
        <Target size={18} className="icon-coffee" />
        <span>BINGO GAMES</span>
      </div>

      <div className="table-headers">
        <div className="h-bet">BET</div>
        <div className="h-win">WIN/PLAYER</div>
        <div className="h-status">STATUS & JOIN</div>
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
                <button className="btn-join-simple" onClick={() => handleJoin(room.type, room.price)}>JOIN</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DEMO ROW */}
      <div className="demo-section-simple">
        <div className="jackpot-divider">JACKPOT 0 / 1000</div>
        <div className="demo-row-simple" onClick={() => handleJoin('CASUAL', 0)}>
           <div className="demo-left">
              <div className="f">FREE</div>
              <div className="d">DEMO</div>
           </div>
           <div className="demo-mid">
              <Play size={18} className="p-icon" />
              <div className="m-info">
                 <div className="t">Practice Mode</div>
                 <div className="s">No real money</div>
              </div>
           </div>
           <div className="demo-right">
              <button className="btn-open-mini">OPEN</button>
              <button className="btn-try-mini">TRY</button>
           </div>
        </div>
      </div>

      <div className="section-header-simple mt-20">
        <Dices size={18} className="icon-coffee" />
        <span>SPIN GAMES</span>
      </div>

      <div className="rooms-stack">
        {roomConfig.map((room, idx) => (
          <div key={`spin-${room.type}`} className="room-item-wrapper">
             {idx > 0 && <div className="jackpot-divider">JACKPOT 0 / 1000</div>}
             <div className="room-row-simple">
                <div className="col-bet-simple">
                  <div className="v">{room.price}</div>
                  <div className="l">ETB</div>
                </div>
                <div className="col-win-simple">
                  <Trophy size={20} className="trophy-muted" />
                  <div className="win-info">
                     <div className="v">0</div>
                     <div className="p">0 players</div>
                  </div>
                </div>
                <div className="col-action-simple">
                  <div className="badges-stack">
                    <div className="badge-active">ACTIVE 0</div>
                    <div className="badge-ready">READY</div>
                  </div>
                  <button className="btn-join-simple outline" onClick={() => show('Coming soon!', 'info')}>JOIN</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <Navbar />

    </div>
  );
}

