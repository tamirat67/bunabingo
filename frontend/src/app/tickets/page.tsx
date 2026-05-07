'use client';
import { useEffect, useState } from 'react';
import { getRooms, getWallet } from '../../lib/api';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/Toast';

interface Room {
  id: string;
  type: 'CASUAL' | 'STANDARD' | 'JACKPOT' | 'VIP';
  ticketPrice: string;
  currentPlayers: number;
}

export default function LobbyPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    Promise.all([getRooms(), getWallet()])
      .then(([r, w]) => {
        setRooms(r);
        setWallet(w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = (type: string, price: string) => {
    router.push(`/tickets/select?type=${type}&price=${price}`);
  };

  const handleTry = () => {
    show('Starting Practice Mode... 🎮', 'info');
    setTimeout(() => router.push('/tickets/select?type=CASUAL&price=0&demo=true'), 1000);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="lobby-container">
      {/* ─── Top Navigation ──────────────────────────────────── */}
      <div className="lobby-nav">
        <div className="nav-left">
          <span className="live-dot pulse"></span>
          <span className="live-lbl">Live</span>
        </div>
        <div className="nav-right">
          <div className="nav-stat">
            <span className="icon yellow">🎗️</span>
            <span className="lbl">Bonus:</span>
            <span className="val yellow">0.00</span>
          </div>
          <div className="nav-stat">
            <span className="icon green">👛</span>
            <span className="lbl">Balance:</span>
            <span className="val">{Number(wallet?.balance || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ─── Bingo Games Section ───────────────────────────── */}
      <div className="section-title">
        <span className="emoji">🎯</span> BINGO GAMES
      </div>

      <div className="column-headers">
        <span>BET</span>
        <span>WIN/PLAYER</span>
        <span>STATUS & JOIN</span>
      </div>

      <div className="game-list">
        {[10, 20, 50, 100].map((price, idx) => {
          const type = price === 10 ? 'CASUAL' : price === 20 ? 'STANDARD' : price === 50 ? 'JACKPOT' : 'VIP';
          const players = price === 10 ? 74 : 0;
          const win = price === 10 ? 592 : 0;
          return (
            <div key={`bingo-${price}`}>
              <div className="room-row">
                <div className="col-bet">
                  <div className="v">{price}</div>
                  <div className="l">ETB</div>
                </div>
                <div className="col-win">
                  <div className="win-main">
                    <span className="trophy">🏆</span>
                    <div className="win-stack">
                      <div className="win-val yellow">{win}</div>
                      <div className="win-count">{players} players</div>
                    </div>
                  </div>
                </div>
                <div className="col-status">
                  <div className="badge active">ACTIVE {price === 50 ? 1 : 0}</div>
                  <div className="ready-box">READY</div>
                  <div className="join-wrap">
                    {(price === 10 || price === 100) && <div className="bonus-tag">🎗️ BONUS</div>}
                    <button className="btn-join green" onClick={() => handleJoin(type, price.toString())}>JOIN</button>
                  </div>
                </div>
              </div>
              <div className="jackpot-divider">JACKPOT {price === 10 ? 508 : 0} / 1000</div>
            </div>
          );
        })}

        {/* Free Demo */}
        <div className="room-row demo">
          <div className="col-bet">
            <div className="v">FREE</div>
            <div className="l">DEMO</div>
          </div>
          <div className="col-win">
            <div className="win-main">
              <span className="play-icon">▶️</span>
              <div className="win-stack">
                <div className="demo-title">Practice Mode</div>
                <div className="win-count">No real money</div>
              </div>
            </div>
          </div>
          <div className="col-status">
            <div className="open-lbl">OPEN</div>
            <button className="btn-try" onClick={handleTry}>TRY</button>
          </div>
        </div>
      </div>

      {/* ─── Spin Games Section ────────────────────────────── */}
      <div className="section-title sp-mt">
        <span className="emoji">🎰</span> SPIN GAMES
      </div>

      <div className="game-list">
        {[10, 20, 50, 100].map((price) => (
          <div key={`spin-${price}`}>
            <div className="room-row">
              <div className="col-bet">
                <div className="v">{price}</div>
                <div className="l">ETB</div>
              </div>
              <div className="col-win">
                <div className="win-main">
                  <span className="trophy">🏆</span>
                  <div className="win-stack">
                    <div className="win-val yellow">0</div>
                    <div className="win-count">0 players</div>
                  </div>
                </div>
              </div>
              <div className="col-status">
                <div className="badge active">ACTIVE 0</div>
                <div className="ready-box">READY</div>
                <div className="join-wrap">
                  {price === 10 && <div className="bonus-tag">🎗️ BONUS</div>}
                  <button className="btn-join outline" onClick={() => show(`Spin ${price} ETB coming soon! 🎰`, 'info')}>JOIN</button>
                </div>
              </div>
            </div>
            <div className="jackpot-divider">JACKPOT 0 / 1000</div>
          </div>
        ))}
      </div>

      <Navbar />

      
    </div>
  );
}

