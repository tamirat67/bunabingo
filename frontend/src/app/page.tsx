'use client';
import { useEffect } from 'react';
import { initTelegram } from '../lib/telegram';

export default function HomePage() {
  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <div className="loading">
      <div className="spinner"></div>
      <span>BUNA BINGO READY</span>
      <p style={{marginTop: '10px', fontSize: '12px'}}>Send me your new UI code!</p>
    </div>
  );
}
