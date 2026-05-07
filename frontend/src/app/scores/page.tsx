'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard } from '../../lib/api';
import Navbar from '../../components/Navbar';
import { Trophy, ChevronLeft, Star } from 'lucide-react';

interface Leader {
  id: string;
  name: string;
  tgId: string;
  score: number;
  amount: number;
  rank: number;
}

function ScoresContent() {
  const router = useRouter();
  const [boardType, setBoardType] = useState<'score' | 'bonus'>('score');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(timeframe);
      setLeaders(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [timeframe]);

  if (loading && leaders.length === 0) return <div className="loading"><div className="spinner" /><span>SYNCING SCORES...</span></div>;

  return (
    <div className="buna-scores-container">
      {/* Top Navigation */}
      <div className="top-header-nav">
        <button className="btn-back-nav" onClick={() => router.push('/')}>
          <ChevronLeft size={24} />
        </button>
        <div className="title-stack">
          <h1>Leaderboard</h1>
          <p>Top Winners</p>
        </div>
      </div>

      {/* Board Switcher */}
      <div className="board-switcher">
         <button className={`sw-item ${boardType === 'score' ? 'active' : ''}`} onClick={() => setBoardType('score')}>
            Score Board
         </button>
         <button className={`sw-item ${boardType === 'bonus' ? 'active' : ''}`} onClick={() => setBoardType('bonus')}>
            Bonus Board
         </button>
      </div>

      {/* Timeframe Filter */}
      <div className="timeframe-filter">
         {(['today', 'week', 'month'] as const).map(tf => (
           <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
           </button>
         ))}
      </div>

      {/* Top 3 Spotlight */}
      <div className="top-spotlight">
         <div className="spot-item s2">
            <div className="avatar-circle">{leaders[1]?.name.charAt(0) || '?'}</div>
            <div className="rank-badge">2</div>
            <div className="name">{leaders[1]?.name || '---'}</div>
         </div>
         <div className="spot-item s1">
            <div className="avatar-circle gold-border">{leaders[0]?.name.charAt(0) || '?'}</div>
            <div className="rank-badge gold">1</div>
            <div className="name">{leaders[0]?.name || '---'}</div>
         </div>
         <div className="spot-item s3">
            <div className="avatar-circle">{leaders[2]?.name.charAt(0) || '?'}</div>
            <div className="rank-badge">3</div>
            <div className="name">{leaders[2]?.name || '---'}</div>
         </div>
      </div>

      {/* Ranking List */}
      <div className="ranking-list-section">
         <div className="list-hdr">Top Players (100)</div>
         <div className="ranking-scroll">
            {leaders.length === 0 && !loading && (
              <div className="empty-scores">No wins recorded for this period yet.</div>
            )}
            {leaders.map((player) => (
              <div key={player.id} className="rank-card">
                 <div className={`rank-initial ${player.rank <= 3 ? 'top' : ''}`}>
                    {player.name.charAt(0)}
                 </div>
                 <div className="player-details">
                    <div className="p-name">{player.name}</div>
                    <div className="p-id">{player.tgId}</div>
                 </div>
                 <div className="player-score">
                    {player.score}
                 </div>
              </div>
            ))}
         </div>
      </div>

      <Navbar />

      
    </div>
  );
}

export default function ScoresPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /><span>LOADING BOARD...</span></div>}>
      <ScoresContent />
    </Suspense>
  );
}

