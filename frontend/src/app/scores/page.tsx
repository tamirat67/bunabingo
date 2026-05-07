'use client';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const PLAYERS = [
  { name: 'HI 5', phone: '25198**50501', score: 39, color: '#ffa726', initial: 'H5' },
  { name: 'Medu', phone: '25192**31677', score: 21, color: '#66bb6a', initial: 'M' },
  { name: 'Ablel', phone: '25198**40848', score: 20, color: '#42a5f5', initial: 'A' },
  { name: 'Abdi Boru', phone: '25191**94528', score: 20, color: '#ef5350', initial: 'AB' },
  { name: 'Nafi', phone: '25191**50260', score: 18, color: '#ab47bc', initial: 'N' },
  { name: 'tebedaBaby', phone: '25171**59746', score: 17, color: '#ffa726', initial: 'T' },
  { name: 'Eliad', phone: '25192**89711', score: 15, color: '#66bb6a', initial: 'E' },
];

export default function ScoresPage() {
  const [board, setBoard] = useState('score');
  const [time, setTime] = useState('today');

  return (
    <div className="scores-container">
      <div className="board-toggle">
        <div className={`toggle-pill ${board === 'score' ? 'active' : ''}`} onClick={() => setBoard('score')}>Score Board</div>
        <div className={`toggle-pill ${board === 'bonus' ? 'active' : ''}`} onClick={() => setBoard('bonus')}>Bonus Board</div>
      </div>

      <div className="time-filters">
        <div className={`time-pill ${time === 'today' ? 'active' : ''}`} onClick={() => setTime('today')}>Today</div>
        <div className={`time-pill ${time === 'week' ? 'active' : ''}`} onClick={() => setTime('week')}>This Week</div>
        <div className={`time-pill ${time === 'month' ? 'active' : ''}`} onClick={() => setTime('month')}>This Month</div>
      </div>

      <div className="top-avatars">
        {PLAYERS.slice(0, 5).map((p, i) => (
          <div key={i} className="mini-avatar">{p.initial}</div>
        ))}
      </div>

      <div style={{textAlign: 'center', fontSize: '13px', fontWeight: 'bold', margin: '10px 0'}}>Top Players (100)</div>

      <div className="leader-list">
        {PLAYERS.map((p, i) => (
          <div key={i} className="leader-row">
            <div className="leader-info">
              <div className="row-avatar" style={{background: p.color}}>{p.initial}</div>
              <div className="leader-name">
                <span className="name-txt">{p.name}</span>
                <span className="phone-sub">{p.phone}</span>
              </div>
            </div>
            <div className="leader-score">{p.score}</div>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  );
}
