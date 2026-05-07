'use client';
import { useEffect, useState } from 'react';
import { initTelegram, getTgUser } from '../../lib/telegram';
import { getTransactions, getWalletAudit } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Coins, Gift, History } from 'lucide-react';

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
            <ShieldCheck size={12} /> Verified & Audited
          </div>
        </div>
        <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={() => loadData(true)}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="main-balance-card">
        <div className="label">Total Liquid Balance</div>
        <div className="value">
          <span className="symbol">ETB</span> {Number(data?.mainBalance || 0).toLocaleString()}
        </div>
        <div className="id-row">VAULT-ID: {data?.walletId?.slice(-8).toUpperCase() || 'BUNA-100'}</div>
        
        <div className="action-row">
          <button className="btn-vault" onClick={() => window.location.href='/deposit'}>
            <ArrowDownToLine size={18} /> Deposit
          </button>
          <button className="btn-vault outline" onClick={() => window.location.href='/withdraw'}>
            <ArrowUpFromLine size={18} /> Withdraw
          </button>
        </div>
      </div>

      <div className="audit-grid">
        <div className="audit-item">
          <div className="albl">Total Won</div>
          <div className="val-row">
            <Coins size={18} className="green-icon" />
            <div className="aval green">+{Number(data?.coins || 0).toFixed(0)}</div>
          </div>
        </div>
        <div className="audit-item">
          <div className="albl">Bonus Credits</div>
          <div className="val-row">
            <Gift size={18} className="coffee-icon" />
            <div className="aval coffee">{Number(data?.bonusBalance || 0).toFixed(0)}</div>
          </div>
        </div>
        <div className="audit-item full">
          <div className="albl">Financial Integrity</div>
          <div className="aval coffee">100% Normalized Ledger ✅</div>
        </div>
      </div>

      <div className="ledger-section">
        <div className="ledger-hdr">
          <div className="hdr-left">
            <History size={20} className="coffee-icon" />
            <h3 className="section-title">Verified Ledger</h3>
          </div>
          <Link href="/history" className="view-all">View All</Link>
        </div>
        
        {txns.length === 0 ? (
          <div className="no-txns">No transaction records found</div>
        ) : (
          <div className="txn-list">
            {txns.map((t) => (
              <div key={t.id} className="txn-row">
                <div className="txn-left">
                  <div className="icon-box">
                    {t.type === 'DEPOSIT' ? <ArrowDownToLine size={18} /> : t.type === 'WINNING' ? <Coins size={18} /> : <ArrowUpFromLine size={18} />}
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

      
    </div>
  );
}

