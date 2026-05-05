'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRooms, joinGame, getWallet } from '../../lib/api';
import { haptic } from '../../lib/telegram';
import Navbar from '../../components/Navbar';

interface Room { id: string; type: string; ticketPrice: string; minPlayers: number; games: { id: string; status: string; tickets: { userId: string }[] }[] }

const ROOM_META: Record<string, { icon: string; name: string; desc: string; color: string }> = {
  CASUAL:   { icon: '🟢', name: 'Casual Room',  desc: '2+ players · 30s countdown',  color: '#22c55e' },
  STANDARD: { icon: '🔵', name: 'Standard Room', desc: '5+ players · 15s countdown',  color: '#3b82f6' },
  JACKPOT:  { icon: '💎', name: 'Jackpot Room',  desc: '20+ players · 5s countdown',  color: '#f5c542' },
};

export default function TicketsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([getRooms(), getWallet()])
      .then(([r, w]) => { setRooms(r); setBalance(Number(w.balance)); })
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin() {
    if (!selected) return;
    setError(''); setJoining(true);
    try {
      const res = await joinGame(selected);
      haptic('success');
      router.push(`/game?id=${res.gameId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to join');
      haptic('error');
    } finally {
      setJoining(false);
    }
  }

  const selectedRoom = rooms.find(r => r.type === selected);
  const canAfford = selectedRoom ? balance >= Number(selectedRoom.ticketPrice) : false;

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading rooms…</span></div>;

  return (
    <>
      <div className="page-hdr">
        <div>
          <div className="page-title">🎫 Join Game</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 2 }}>Balance: <span style={{ color: 'var(--gold)' }}>{balance.toFixed(2)} ETB</span></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-title">Choose Room</div>

        {rooms.map(room => {
          const meta = ROOM_META[room.type] || { icon: '🎮', name: room.type, desc: '', color: 'var(--gold)' };
          const game = room.games[0];
          const players = game?.tickets?.length ?? 0;
          const price = Number(room.ticketPrice);
          const affordable = balance >= price;

          return (
            <div key={room.type}
              className={`room-card${selected === room.type ? ' selected' : ''}`}
              onClick={() => { if (affordable) { setSelected(room.type); haptic('click'); } }}
              style={{ opacity: affordable ? 1 : 0.5 }}
            >
              <span style={{ fontSize: 36 }}>{meta.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{meta.name}</div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>{meta.desc}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-muted">👥 {players} waiting</span>
                  {!affordable && <span className="badge badge-red">Insufficient funds</span>}
                  {game?.status === 'COUNTDOWN' && <span className="badge badge-green">⏱ Starting!</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="room-price">{price}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)' }}>ETB/ticket</div>
              </div>
            </div>
          );
        })}

        {error && <div className="badge badge-red" style={{ padding: '10px 14px', borderRadius: 10 }}>⚠️ {error}</div>}

        <button
          className="btn btn-gold btn-full btn-lg"
          onClick={handleJoin}
          disabled={!selected || !canAfford || joining}
        >
          {joining ? '⏳ Joining…' : selected ? `🎮 Join ${ROOM_META[selected]?.name}` : 'Select a Room'}
        </button>

        {balance < 10 && (
          <div className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--txt2)' }}>Not enough balance?</div>
            <a href="/deposit" className="btn btn-ghost btn-sm" style={{ marginTop: 10, display: 'inline-flex' }}>📥 Deposit Now</a>
          </div>
        )}
      </div>
      <Navbar />
    </>
  );
}
