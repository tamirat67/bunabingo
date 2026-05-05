'use client';
import { Suspense } from 'react';
import GameInner from './GameInner';

export default function GamePage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /><span>Loading game…</span></div>}>
      <GameInner />
    </Suspense>
  );
}
