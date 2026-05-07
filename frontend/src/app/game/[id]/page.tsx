'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, RefreshCw, LogOut, Star, Zap } from 'lucide-react';
import Navbar from '../../../components/Navbar';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(35);
  const [currentCall, setCurrentCall] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Simulation for UI demonstration
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 35));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const bingoColumns = {
    B: Array.from({length: 15}, (_, i) => i + 1),
    I: Array.from({length: 15}, (_, i) => i + 16),
    N: Array.from({length: 15}, (_, i) => i + 31),
    G: Array.from({length: 15}, (_, i) => i + 46),
    O: Array.from({length: 15}, (_, i) => i + 61),
  };

  const playerCard = [
    [7, 22, 34, 60, 73],
    [6, 20, 31, 54, 72],
    [1, 24, null, 57, 62],
    [13, 26, 32, 58, 66],
    [11, 25, 42, 47, 70],
  ];

  return (
    <div className="game-screen-container">
      {/* Top Info Bar */}
      <div className="game-info-grid">
        <div className="info-box">
          <div className="label">Room</div>
          <div className="val">GM-10-{params.id?.slice(-5) || '13187'}</div>
        </div>
        <div className="info-box">
          <div className="label">Derash</div>
          <div className="val">16</div>
        </div>
        <div className="info-box">
          <div className="label">Bonus</div>
          <div className="val">-</div>
        </div>
        <div className="info-box">
          <div className="label">Players</div>
          <div className="val">2</div>
        </div>
        <div className="info-box">
          <div className="label">Bet</div>
          <div className="val">10.00</div>
        </div>
        <div className="info-box">
          <div className="label">Call</div>
          <div className="val">{calledNumbers.length}</div>
        </div>
      </div>

      <div className="game-main-layout">
        {/* Left: Calling Board */}
        <div className="calling-board-card">
          <div className="board-header">
            <div className="h b">B</div>
            <div className="h i">I</div>
            <div className="h n">N</div>
            <div className="h g">G</div>
            <div className="h o">O</div>
          </div>
          <div className="board-numbers">
            {Object.entries(bingoColumns).map(([col, nums]) => (
              <div key={col} className="col-strip">
                {nums.map(n => (
                  <div key={n} className={`n-cell ${calledNumbers.includes(n) ? 'active' : ''}`}>
                    {n}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stats and Card */}
        <div className="game-right-side">
          <div className="status-card countdown">
            <div className="l">COUNT DOWN</div>
            <div className="v">{countdown}</div>
          </div>

          <div className="status-card call-display">
            <div className="l">CURRENT CALL</div>
            <div className="call-circle">
              {currentCall || '-'}
            </div>
          </div>

          <div className="player-bingo-card">
            <div className="card-header">
              <div className="h b">B</div>
              <div className="h i">I</div>
              <div className="h n">N</div>
              <div className="h g">G</div>
              <div className="h o">O</div>
            </div>
            <div className="card-grid">
              {playerCard.map((row, ri) => (
                row.map((val, ci) => (
                  <div key={`${ri}-${ci}`} className={`card-cell ${val === null ? 'star' : ''}`}>
                    {val === null ? <Star size={16} fill="var(--gold)" color="var(--gold)" /> : val}
                  </div>
                ))
              ))}
            </div>
            <div className="board-label">BOARD NUMBER 79</div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="game-actions-footer">
        <button className="btn-bingo-main disabled">BINGO!</button>
        <div className="secondary-btns">
          <button className="btn-refresh-game"><RefreshCw size={18} /> Refresh</button>
          <button className="btn-leave-game" onClick={() => router.push('/')}><LogOut size={18} /> Leave</button>
        </div>
      </div>
    </div>
  );
}
