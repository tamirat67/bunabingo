'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getWallet, joinGame } from '../../../lib/api';
import { PREDEFINED_CARDS } from '../../../lib/predefinedCards';
import Navbar from '../../../components/Navbar';
import { useToast } from '../../../components/Toast';

function SelectCardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show } = useToast();
  const roomType = searchParams.get('type') || 'CASUAL';
  const pricePerCard = Number(searchParams.get('price') || '10');

  const [wallet, setWallet] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWallet().then(setWallet).catch(() => {});
  }, []);

  const totalStake = selectedCards.length * pricePerCard;
  const hasBalance = Number(wallet?.balance || 0) >= totalStake;

  const toggleCard = (num: number) => {
    if (selectedCards.includes(num)) {
      setSelectedCards(selectedCards.filter(n => n !== num));
    } else {
      if (selectedCards.length >= 3) {
        show('Maximum 3 cards allowed! 🛡️', 'error');
        return;
      }
      const newSelection = [...selectedCards, num];
      setSelectedCards(newSelection);
      
      // Fun Toasts for multi-selection
      if (newSelection.length === 2) show('Nice! Double your chances! ✌️', 'success');
      if (newSelection.length === 3) show('JACKPOT MODE! 3 Cards active! 🔥', 'success');
    }
  };

  const handleStart = async () => {
    if (selectedCards.length === 0) return show('Tap a number to select your card!', 'error');
    if (!hasBalance) return show('Insufficient balance!', 'error');

    setLoading(true);
    try {
      let gId = '';
      for (const cardId of selectedCards) {
        const res = await joinGame(roomType, cardId);
        gId = res.gameId;
      }
      router.push(`/game?id=${gId}`);
    } catch (err: any) {
      show(err.response?.data?.error || 'Failed to join game', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-container">
      <div className="connection-status">
        <span className="wifi-icon">📶</span> CONNECTED
      </div>

      <div className="stats-row">
        <div className="stat-capsule">
          <div className="lbl orange">Selected</div>
          <div className="val">{selectedCards.length} / 3</div>
        </div>
        <div className="stat-capsule">
          <div className="lbl orange">Stake</div>
          <div className="val">{totalStake || pricePerCard} ETB</div>
        </div>
        <div className="stat-capsule">
          <div className="lbl orange">Wallet</div>
          <div className="val">{Number(wallet?.balance || 0).toFixed(0)}</div>
        </div>
        <div className="stat-capsule">
          <div className="lbl orange">Bonus</div>
          <div className="val">0</div>
        </div>
      </div>

      {!hasBalance && selectedCards.length > 0 && (
        <div className="balance-warning">
          <p>Need {totalStake} ETB for {selectedCards.length} cards.</p>
          <button className="btn-deposit-now" onClick={() => router.push('/deposit')}>
            📥 Deposit Now
          </button>
        </div>
      )}

      <div className="card-grid">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            className={`grid-item ${selectedCards.includes(num) ? 'selected' : ''}`}
            onClick={() => toggleCard(num)}
          >
            {num}
          </div>
        ))}
      </div>

      {/* ─── Multi-Card Pattern Preview ───────────────────── */}
      <div className="previews-container">
        {selectedCards.length > 0 ? (
          <div className="previews-scroll">
            {selectedCards.map((id) => (
              <div key={id} className="hint-card-wrapper">
                <div className="cartela-hint">
                  <div className="hint-header">
                    <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
                  </div>
                  {(PREDEFINED_CARDS as any)[id].map((row: any[], ri: number) => (
                    <div key={ri} className="hint-row">
                      {row.map((cell, ci) => (
                        <span key={ci} className={`hint-cell ${cell === '*' ? 'star' : ''}`}>
                          {cell === '*' ? '⭐' : cell}
                        </span>
                      ))}
                    </div>
                  ))}
                  <div className="hint-card-num">Card #{id}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="preview-placeholder">Tap up to 3 cards to see patterns</div>
        )}
      </div>

      {/* ─── Action Section ────────────────────────────────── */}
      <div className="action-bar">
        <button className="btn-reset" onClick={() => setSelectedCards([])}>Clear Selection</button>
        <button 
          className={`btn-start ${selectedCards.length === 0 || !hasBalance || loading ? 'disabled' : ''}`}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Entering Room...' : selectedCards.length > 1 ? `PLAY ${selectedCards.length} CARDS` : 'START GAME'}
        </button>
      </div>

      <Navbar />

      <style jsx>{`
        .select-container { min-height: 100vh; background: #2d1b4d; padding: 16px; padding-bottom: 100px; }
        .connection-status { text-align: center; color: #4ade80; font-weight: 800; font-size: 14px; margin-bottom: 12px; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 16px; }
        .stat-capsule { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 2px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
        .stat-capsule .lbl { font-size: 8px; color: #f97316; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; }
        .stat-capsule .val { font-size: 12px; color: white; font-weight: 800; }

        .card-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 12px; margin-bottom: 20px; }
        .grid-item { aspect-ratio: 1; background: rgba(255,255,255,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; }
        .grid-item.selected { background: #22c55e; color: white; transform: scale(1.05); box-shadow: 0 0 15px rgba(34,197,94,0.4); border: 2px solid white; }

        .previews-container { margin-bottom: 24px; min-height: 140px; }
        .previews-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 4px; padding-bottom: 12px; scroll-snap-type: x mandatory; }
        .hint-card-wrapper { flex: 0 0 130px; scroll-snap-align: start; }
        .preview-placeholder { text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; font-weight: 700; padding-top: 50px; }

        .cartela-hint { background: white; padding: 8px; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
        .hint-header { display: flex; gap: 2px; justify-content: center; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .hint-header span { width: 20px; font-size: 10px; font-weight: 900; color: #f97316; text-align: center; }
        .hint-row { display: flex; gap: 2px; justify-content: center; }
        .hint-cell { width: 20px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: #333; }
        .hint-cell.star { font-size: 10px; }
        .hint-card-num { font-size: 8px; color: #999; text-align: center; margin-top: 4px; font-weight: 700; }

        .action-bar { display: flex; flex-direction: column; gap: 12px; }
        .btn-reset { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-start { background: linear-gradient(180deg, #f97316 0%, #ea580c 100%); border: none; color: white; padding: 16px; border-radius: 16px; font-weight: 900; font-size: 20px; box-shadow: 0 4px 0 #9a3412; cursor: pointer; }
        .btn-start.disabled { background: #444; box-shadow: none; opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default function SelectCardPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <SelectCardInner />
    </Suspense>
  );
}
