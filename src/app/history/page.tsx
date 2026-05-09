'use client';
import { useEffect, useState } from 'react';
import { getHistory, getGlobalHistory } from '../../lib/api';
import { RefreshCw, Search, Trophy, Calendar, Clock, User } from 'lucide-react';

export default function HistoryPage() {
  const [tab, setTab] = useState('recent'); // 'recent' or 'my'
  const [filter, setFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [globalHistory, setGlobalHistory] = useState<any[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadData = () => {
    getGlobalHistory().then(setGlobalHistory).catch(() => {});
    getHistory().then(setMyHistory).catch(() => {});
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  if (!mounted) return null;

  const currentData = tab === 'recent' ? globalHistory : myHistory;
  
  const filteredData = currentData.filter(item => {
    if (filter && Number(item.game?.room?.ticketPrice) !== filter) return false;
    if (search && !item.user?.firstName?.toLowerCase().includes(search.toLowerCase()) && 
        !item.gameId?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="history-container">
      <div className="wallet-header" style={{ justifyContent: 'center', position: 'relative' }}>
        <span>Bingo History</span>
        <RefreshCw size={20} style={{ position: 'absolute', right: 0 }} onClick={loadData} />
      </div>

      <div className="history-tabs">
        <div className={`h-tab ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')}>Recent Games</div>
        <div className={`h-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>My Games</div>
      </div>

      <div className="filter-chips">
        {[10, 20, 50, 100].map(amt => (
          <div 
            key={amt} 
            className={`f-chip ${filter === amt ? 'active' : ''}`}
            onClick={() => setFilter(filter === amt ? null : amt)}
          >
            {amt} Birr
          </div>
        ))}
      </div>

      <div className="search-bar">
        <Search size={16} opacity={0.5} />
        <input 
          type="text" 
          placeholder="Search by game number..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="history-list">
        {filteredData.map((item, i) => {
          const date = new Date(item.paidAt);
          const dateStr = date.toLocaleDateString();
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const name = item.user?.firstName || item.user?.telegramUsername || 'Me';
          const refCode = item.gameId.substring(0, 6).toUpperCase();
          const boardNum = item.ticketId.substring(0, 4).toUpperCase();

          return (
            <div key={item.id} className="history-card">
              <div className="hc-left">
                <Trophy size={32} color="#D4AF37" />
                <div className="hc-info">
                  <div className="hc-name"><User size={12} /> {name}</div>
                  <div className="hc-sub">Refs: {refCode}</div>
                  <div className="hc-sub">Board #{boardNum}</div>
                  <div className="hc-sub">22 calls</div>
                </div>
              </div>
              <div className="hc-right">
                <div className="hc-date"><Calendar size={12} /> {dateStr}</div>
                <div className="hc-date"><Clock size={12} /> {timeStr}</div>
                <div className="hc-prize">{Number(item.prizeAmount).toFixed(0)} birr</div>
              </div>
            </div>
          );
        })}
        {filteredData.length === 0 && <div className="empty-state">No games found</div>}
      </div>
    </div>
  );
}
