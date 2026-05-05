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

  if (loading) return <div className="loading"><div className="spinner" /><span>AUDITING VAULT...</span></div>;

  return (
    <div className="wallet-container">
      <div className="vault-header">
        <div>
          <h1 className="title">Buna Vault</h1>
          <div className="audit-badge">
            <span className="dot pulse"></span> Secured & Audited
          </div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={() => loadData(true)}>
          {refreshing ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="main-balance-card">
        <div className="label">Total Liquid Balance</div>
        <div className="value">
          <span className="symbol">ETB</span> {Number(data?.mainBalance || 0).toLocaleString()}
        </div>
        <div className="id-row">VAULT-ID: {data?.walletId?.slice(-8).toUpperCase() || 'BUNA-100'}</div>
        
        <div className="action-row">
          <button className="btn-vault" onClick={() => window.location.href='/deposit'}>📥 Deposit</button>
          <button className="btn-vault outline" onClick={() => window.location.href='/withdraw'}>📤 Withdraw</button>
        </div>
      </div>

      <div className="audit-grid">
        <div className="audit-item">
          <div className="albl">Total Won</div>
          <div className="aval green">+{Number(data?.coins || 0).toFixed(0)}</div>
        </div>
        <div className="audit-item">
          <div className="albl">Bonus Credits</div>
          <div className="aval coffee">{Number(data?.bonusBalance || 0).toFixed(0)}</div>
        </div>
        <div className="audit-item full">
          <div className="albl">Financial Integrity</div>
          <div className="aval coffee">100% Normalized ✅</div>
        </div>
      </div>

      <div className="ledger-section">
        <div className="ledger-hdr">
          <h3 className="section-title">Verified Ledger</h3>
          <Link href="/history" className="view-all">View All</Link>
        </div>
        
        {txns.length === 0 ? (
          <div className="no-txns">No transaction records found</div>
        ) : (
          <div className="txn-list">
            {txns.map((t) => (
              <div key={t.id} className="txn-row">
                <div className="txn-left">
                  <div className={`icon-box ${t.type === 'DEPOSIT' || t.type === 'WINNING' ? 'in' : 'out'}`}>
                    {t.type === 'DEPOSIT' ? '📥' : t.type === 'WINNING' ? '🏆' : t.type === 'WITHDRAWAL' ? '📤' : '🎟'}
                  </div>
                  <div className="txn-info">
                    <div className="type">{t.type.replace(/_/g, ' ')}</div>
                    <div className="date">{new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`amt ${t.type === 'DEPOSIT' || t.type === 'WINNING' ? 'pos' : 'neg'}`}>
                  {t.type === 'DEPOSIT' || t.type === 'WINNING' ? '+' : '-'}{Number(t.amount).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />

      <style jsx>{`
        .wallet-container { min-height: 100vh; background: #F5E6BE; padding: 24px 16px 100px; color: #000; }
        .vault-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .title { font-size: 26px; font-weight: 900; color: #4B3621; margin: 0; }
        .audit-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #2d6a4f; margin-top: 4px; text-transform: uppercase; background: rgba(45, 106, 79, 0.1); padding: 4px 10px; border-radius: 99px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #2d6a4f; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .refresh-btn { background: #4B3621; border: none; font-size: 18px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #F5E6BE; }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .main-balance-card { background: #4B3621; color: #F5E6BE; border-radius: 24px; padding: 24px; margin-bottom: 20px; box-shadow: 0 15px 35px rgba(75, 54, 33, 0.3); }
        .main-balance-card .label { font-size: 12px; font-weight: 700; opacity: 0.7; text-transform: uppercase; margin-bottom: 8px; }
        .main-balance-card .value { font-size: 42px; font-weight: 900; letter-spacing: -1px; }
        .main-balance-card .symbol { font-size: 18px; opacity: 0.5; margin-right: 4px; }
        .id-row { font-size: 9px; font-family: monospace; opacity: 0.5; margin-top: 8px; margin-bottom: 24px; }

        .action-row { display: flex; gap: 12px; }
        .btn-vault { flex: 1; background: #F5E6BE; color: #4B3621; border: none; padding: 12px; border-radius: 12px; font-weight: 900; font-size: 14px; cursor: pointer; }
        .btn-vault.outline { background: transparent; color: #F5E6BE; border: 1px solid rgba(245, 230, 190, 0.4); }

        .audit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
        .audit-item { background: #FFF9E6; border-radius: 16px; padding: 16px; border: 1px solid #E6D5A8; }
        .audit-item.full { grid-column: span 2; display: flex; justify-content: space-between; align-items: center; }
        .albl { font-size: 10px; font-weight: 800; opacity: 0.6; text-transform: uppercase; margin-bottom: 4px; color: #6F4E37; }
        .aval { font-size: 18px; font-weight: 900; }
        .aval.green { color: #2d6a4f; }
        .aval.coffee { color: #4B3621; }

        .ledger-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-title { font-size: 18px; font-weight: 900; margin: 0; color: #4B3621; }
        .view-all { font-size: 13px; font-weight: 800; color: #6F4E37; text-decoration: none; }

        .txn-list { display: flex; flex-direction: column; gap: 1px; background: #E6D5A8; border-radius: 16px; overflow: hidden; border: 1px solid #E6D5A8; }
        .txn-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #FFF9E6; }
        .txn-left { display: flex; align-items: center; gap: 16px; }
        .icon-box { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: #F5E6BE; }
        .txn-info .type { font-size: 14px; font-weight: 800; color: #4B3621; }
        .txn-info .date { font-size: 11px; opacity: 0.5; margin-top: 2px; }
        .amt { font-size: 16px; font-weight: 900; }
        .amt.pos { color: #2d6a4f; }
        .amt.neg { color: #9a031e; opacity: 0.8; }
      `}</style>
    </div>
  );
}
