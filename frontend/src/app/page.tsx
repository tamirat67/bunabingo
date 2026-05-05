'use client';
import { useEffect, useState } from 'react';
import { initTelegram, getTgUser } from '../lib/telegram';
import { getTransactions, getWalletAudit } from '../lib/api';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = getTgUser();

  const loadData = async (isAudit = false) => {
    if (isAudit) setRefreshing(true);
    try {
      const [audit, t] = await Promise.all([getWalletAudit(), getTransactions()]);
      setData(audit);
      setTxns(t.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initTelegram();
    loadData();
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading wallet…</span></div>;

  return (
    <div className="wallet-container">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="wallet-header">
        <h1 className="title">Wallet</h1>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={() => loadData(true)}>
          🔄
        </button>
      </div>

      {/* ─── User Card ─────────────────────────────────────── */}
      <div className="user-card">
        <div className="user-info">
          <span className="icon">👤</span>
          <span className="phone">{user?.username || 'User'}</span>
        </div>
        <div className="verified-badge">✅ Verified</div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────── */}
      <div className="wallet-tabs">
        <div className="tab active">Balance</div>
        <Link href="/history" className="tab">History</Link>
      </div>

      {/* ─── Main Balance Section ──────────────────────────── */}
      <div className="balance-section">
        <div className="main-balance-card">
          <div className="bal-header">
            <span>Main Balance</span>
            <span className="amount">{Number(data?.mainBalance || 0).toFixed(0)} Birr</span>
          </div>

          <div className="sub-bal-grid">
            <div className="sub-bal-card">
              <div className="sub-info">
                <span className="icon">🪙</span>
                <span>Bonus Balance</span>
              </div>
              <span className="sub-val">{Number(data?.bonusBalance || 0).toFixed(0)}</span>
            </div>

            <div className="sub-bal-card">
              <div className="sub-info">
                <span className="icon">🟡</span>
                <span>Coins</span>
              </div>
              <span className="sub-val yellow">{Number(data?.coins || 0).toFixed(0)}</span>
            </div>
          </div>

          <button className="convert-btn">
            📥 Convert Coin
          </button>
        </div>
      </div>

      {/* ─── Recent Transactions ────────────────────────────── */}
      <div className="transactions-section">
        <h3 className="section-title">Recent Transactions</h3>
        
        {txns.length === 0 ? (
          <div className="no-txns">No recent transactions</div>
        ) : (
          <div className="txn-list">
            {txns.map((t) => (
              <div key={t.id} className="txn-row">
                <div className="txn-main">
                  <span className="txn-icon">{t.type === 'DEPOSIT' || t.type === 'WINNING' ? '➕' : '➖'}</span>
                  <div className="txn-details">
                    <div className="txn-type">{t.type.replace(/_/g, ' ')}</div>
                    <div className="txn-date">{new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`txn-amt ${t.type === 'DEPOSIT' || t.type === 'WINNING' ? 'pos' : 'neg'}`}>
                  {t.type === 'DEPOSIT' || t.type === 'WINNING' ? '+' : '-'}{Number(t.amount).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="footer-brand">© Buna Bingo</div>

      <Navbar />

      <style jsx>{`
        .wallet-container { min-height: 100vh; background: #a68cc5; padding: 20px 16px 100px; color: white; }
        
        .wallet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .wallet-header .title { font-size: 24px; font-weight: 800; }
        .refresh-btn { background: none; border: none; font-size: 20px; cursor: pointer; transition: all 0.3s; }
        .refresh-btn.spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .user-card { 
          background: rgba(255,255,255,0.15); border-radius: 16px; padding: 16px 20px;
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
        }
        .user-info { display: flex; align-items: center; gap: 12px; font-weight: 700; }
        .verified-badge { color: #4ade80; font-size: 12px; font-weight: 800; }

        .wallet-tabs { display: flex; gap: 30px; margin-bottom: 24px; border-bottom: 2px solid rgba(255,255,255,0.1); }
        .tab { 
          padding-bottom: 8px; font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.5); 
          text-decoration: none; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px;
        }
        .tab.active { color: white; border-bottom-color: white; }

        .main-balance-card { background: rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; }
        .bal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .bal-header span:first-child { font-size: 18px; font-weight: 600; opacity: 0.8; }
        .bal-header .amount { font-size: 28px; font-weight: 900; }

        .sub-bal-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .sub-bal-card {
          background: rgba(255,255,255,0.1); border-radius: 16px; padding: 16px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .sub-info { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; opacity: 0.8; }
        .sub-val { font-size: 18px; font-weight: 800; }
        .sub-val.yellow { color: #facc15; }

        .convert-btn {
          width: 100%; background: #66bb6a; border: none; color: white; padding: 14px;
          border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer;
          box-shadow: 0 4px 0 #388e3c; transition: all 0.1s;
        }
        .convert-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #388e3c; }

        .transactions-section { margin-top: 32px; margin-bottom: 40px; }
        .section-title { font-size: 18px; font-weight: 800; margin-bottom: 16px; opacity: 0.9; }
        .no-txns { text-align: center; padding: 40px; opacity: 0.4; font-weight: 600; }
        
        .txn-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .txn-main { display: flex; align-items: center; gap: 12px; }
        .txn-icon { font-size: 18px; opacity: 0.5; }
        .txn-type { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .txn-date { font-size: 11px; opacity: 0.5; }
        .txn-amt { font-size: 16px; font-weight: 800; }
        .txn-amt.pos { color: #4ade80; }
        .txn-amt.neg { opacity: 0.8; }

        .footer-brand { text-align: center; font-size: 12px; opacity: 0.3; font-weight: 600; margin-bottom: 20px; }
      `}</style>
    </div>
  );
}
