'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMe, joinGame } from '../../../lib/api';
import { PREDEFINED_CARDS } from '../../../lib/predefinedCards';
import { ChevronLeft, RefreshCw, Play, Zap, X, Star, LayoutGrid, CheckCircle2 } from 'lucide-react';

function TicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomType = searchParams.get('type') || 'STANDARD';
  const ticketPrice = searchParams.get('price') || '10';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [joining, setJoining] = useState(false);
  const [occupiedCards, setOccupiedCards] = useState<number[]>([]); 
  const [jackpot, setJackpot] = useState(808);
  const [dismissAlert, setDismissAlert] = useState(false);

  const loadUser = async () => {
    try {
      const u = await getMe();
      setUser(u);
      setDismissAlert(false); 
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleToggleCard = (num: number) => {
    setSelectedCards(prev => {
      if (prev.includes(num)) {
        return prev.filter(id => id !== num);
      }
      if (prev.length >= 3) return prev; // Hard limit of 3
      return [...prev, num];
    });
  };

  const handleRefresh = async () => {
    setSelectedCards([]);
    await loadUser();
  };

  const handleJoin = async () => {
    if (selectedCards.length === 0 || joining) return;
    setJoining(true);
    try {
      const res = await joinGame(roomType, selectedCards);
      router.push(`/game?id=${res.gameId}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to join game';
      const detail = err.response?.data?.detail ? `\n\nDetail: ${err.response.data.detail.slice(0, 100)}...` : '';
      alert(`${msg}${detail}`);
    } finally {
      setJoining(false);
    }
  };

  const totalCost = selectedCards.length * Number(ticketPrice);
  const balance = Number(user?.wallet?.balance || 0);
  const isLowBalance = balance < totalCost && totalCost > 0;

  if (loading) return <div className="loading"><div className="spinner" /><span>PREPARING CARTELAS...</span></div>;

  return (
    <div className="bingo-selection-container">
      {/* Top Header */}
      <div className="top-header-nav">
        <button className="btn-back-nav" onClick={() => router.push('/')}>
          <ChevronLeft size={24} />
        </button>
        <div className="title-stack">
          <h1>Buna Bingo</h1>
          <p>{roomType} • Stake {ticketPrice}</p>
        </div>
      </div>

      {/* Stats Header Row */}
      <div className="stats-capsule-row">
        <div className="capsule">
          <div className="l">Wallet</div>
          <div className="v">{(user?.wallet?.balance || 0).toFixed(0)}</div>
        </div>
        <div className="capsule">
          <div className="l">Bonus</div>
          <div className="v">0</div>
        </div>
        <div className="capsule">
          <div className="l">Cards</div>
          <div className="v">{selectedCards.length} / 3</div>
        </div>
        <div className="capsule active-stake">
          <div className="l">Total</div>
          <div className="v">{totalCost}</div>
        </div>
      </div>

      {/* Jackpot Bar */}
      <div className="jackpot-card">
        <div className="jack-top">
          <div className="label"><Zap size={14} className="zap" /> JACKPOT</div>
          <div className="count">{jackpot} / 1000</div>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${(jackpot/1000)*100}%` }}></div>
        </div>
      </div>

      {/* Low Balance Alert */}
      {isLowBalance && !dismissAlert && (
        <div className="topup-alert-box dismissible">
          <div className="alert-content">
             <p>⚠️ Please top up your wallet. Total cost: {totalCost} ETB.</p>
          </div>
          <button className="btn-dismiss-alert" onClick={() => setDismissAlert(true)}>
             <X size={16} />
          </button>
        </div>
      )}

      {/* 1-100 Cartela Grid */}
      <div className="grid-scroll-area">
        <div className="cartela-100-grid">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
            const isOccupied = occupiedCards.includes(num);
            const isSelected = selectedCards.includes(num);
            return (
              <div 
                key={num} 
                className={`cartela-item ${isOccupied ? 'held' : ''} ${isSelected ? 'chosen' : ''}`}
                onClick={() => !isOccupied && handleToggleCard(num)}
              >
                {isSelected && <CheckCircle2 size={10} className="check-badge" />}
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* INLINE PREVIEW & ACTION ZONE */}
      <div className="inline-action-zone">
         <div className="preview-column">
            {selectedCards.length > 0 ? (
              <div className="patterns-horizontal-scroll">
                {selectedCards.map((cardId) => {
                  const pattern = PREDEFINED_CARDS[cardId];
                  return (
                    <div key={cardId} className="inline-pattern-box">
                      <div className="pattern-label">#{cardId}</div>
                      <div className="pattern-mini-grid">
                        {pattern?.map((row, ri) => (
                          row.map((num, ci) => (
                            <div key={`${ri}-${ci}`} className={`mini-cell ${num === 0 ? 'free' : ''}`}>
                              {num === 0 ? <Star size={10} fill="var(--gold-accent)" color="var(--gold-accent)" /> : num}
                            </div>
                          ))
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-preview-box">
                 <LayoutGrid size={32} opacity={0.2} />
                 <span>Pick up to 3 cards</span>
              </div>
            )}
         </div>

         <div className="actions-column">
            <button className="btn-refresh-inline" onClick={handleRefresh}>
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <button 
              className={`btn-start-inline ${(joining || selectedCards.length === 0) ? 'locked' : ''}`}
              onClick={handleJoin}
              disabled={joining || selectedCards.length === 0}
            >
              <Play size={18} />
              <span>{joining ? 'JOINING...' : `JOIN WITH ${selectedCards.length} ${selectedCards.length === 1 ? 'CARD' : 'CARDS'}`}</span>
            </button>
         </div>
      </div>

      
    </div>
  );
}

export default function TicketSelectPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /><span>LOADING CARDS...</span></div>}>
      <TicketContent />
    </Suspense>
  );
}

