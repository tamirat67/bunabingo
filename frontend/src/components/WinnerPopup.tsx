'use client';
import { useEffect, useState } from 'react';
import { haptic } from '../lib/telegram';

interface Props {
  winMode: string;
  amount: string;
  onClose: () => void;
}

const COLORS = ['#f5c542','#ef4444','#22c55e','#3b82f6','#a855f7'];

export default function WinnerPopup({ winMode, amount, onClose }: Props) {
  const [pieces, setPieces] = useState<{ id: number; left: string; color: string; dur: string; delay: string }[]>([]);

  useEffect(() => {
    haptic('success');
    const arr = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur: `${1.5 + Math.random() * 2}s`,
      delay: `${Math.random() * 0.8}s`,
    }));
    setPieces(arr);
  }, []);

  const MODE_LABELS: Record<string, string> = {
    ROW: '🔴 Row Complete!', COLUMN: '🟡 Column Complete!',
    DIAGONAL: '🟢 Diagonal!', FOUR_CORNERS: '🔵 Four Corners!', FULL_HOUSE: '💎 FULL HOUSE!',
  };

  return (
    <div className="overlay" onClick={onClose}>
      {pieces.map(p => (
        <span key={p.id} style={{
          position: 'fixed', width: 10, height: 10, borderRadius: 2,
          background: p.color, left: p.left, top: '-10px',
          animation: `bdrop ${p.dur} ${p.delay} linear forwards`,
          pointerEvents: 'none', zIndex: 250,
        }} />
      ))}
      <div className="win-popup" onClick={e => e.stopPropagation()}>
        <span className="win-emoji">🏆</span>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>YOU WIN!</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '8px 0' }}>
          +{Number(amount).toFixed(2)} ETB
        </div>
        <div style={{ fontSize: 14, color: 'var(--txt2)', marginBottom: 24 }}>
          {MODE_LABELS[winMode] || winMode}
        </div>
        <button className="btn btn-gold btn-full btn-lg" onClick={onClose}>
          🎉 Claim & Continue
        </button>
      </div>
    </div>
  );
}
