'use client';
import { useEffect, useState } from 'react';
import { getLeaderboard } from '../../lib/api';

export default function ScoresPage() {
  const [board, setBoard] = useState('score');
  const [time, setTime] = useState('today');
  const [players, setPlayers] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getLeaderboard(time).then(setPlayers).catch(() => {
      // Fallback if API fails
      setPlayers([]);
    });
  }, [time]);

  if (!mounted) return null;

  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="scores-container">
      <div className="s-board-toggle">
        <div className={`s-toggle-pill ${board === 'score' ? 'active' : ''}`} onClick={() => setBoard('score')}>Score Board</div>
        <div className={`s-toggle-pill ${board === 'bonus' ? 'active' : ''}`} onClick={() => setBoard('bonus')}>Bonus Board</div>
      </div>

      <div className="s-time-filters">
        <div className={`s-time-pill ${time === 'today' ? 'active' : ''}`} onClick={() => setTime('today')}>Today</div>
        <div className={`s-time-pill ${time === 'week' ? 'active' : ''}`} onClick={() => setTime('week')}>This Week</div>
        <div className={`s-time-pill ${time === 'month' ? 'active' : ''}`} onClick={() => setTime('month')}>This Month</div>
      </div>

      <div className="s-top-avatars">
        {players.slice(0, 5).map((p, i) => {
          const initial = p.name?.substring(0, 2).toUpperCase() || 'P';
          return (
            <div key={i} className="s-mini-avatar" style={{ background: colors[i % colors.length] }}>
              {initial}
            </div>
          );
        })}
      </div>

      <div className="s-top-title">Top Players ({players.length || 100})</div>

      <div className="s-leader-list">
        {players.map((p, i) => {
          const initial = p.name?.substring(0, 2).toUpperCase() || 'P';
          return (
            <div key={i} className="s-leader-row">
              <div className="s-row-avatar" style={{ background: colors[i % colors.length] }}>
                {initial}
              </div>
              <div className="s-leader-info">
                <span className="s-name">{p.name}</span>
                <span className="s-phone">{p.tgId}</span>
              </div>
              <div className="s-score">{p.score}</div>
            </div>
          );
        })}
        {players.length === 0 && <div className="empty-state">No players found</div>}
      </div>
    </div>
  );
}
