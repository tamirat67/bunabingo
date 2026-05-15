"use client";

import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiTrendingUp, FiDollarSign, FiActivity,
  FiArrowUpRight, FiArrowDownRight, FiUserCheck, FiPieChart
} from 'react-icons/fi';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const userResponse = await api.get('/me');
        const userData = userResponse.data;
        setUser(userData);
        
        const isAdmin = userData.role === 'ADMIN' || userData.isAdmin;
        const endpoint = isAdmin ? '/admin/analytics' : '/agent/stats';
        const statsResponse = await api.get(endpoint);
        setStats(statsResponse.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card-m animate-pulse" style={{ height: '140px' }}></div>
        ))}
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN' || user.isAdmin;

  const statCards = isAdmin ? [
    { label: 'Global Sales', value: `${(stats.globalSales || 0).toLocaleString()} ETB`, icon: FiPieChart, trend: 'Gross Volume', color: 'blue' },
    { label: 'Company Revenue', value: `${(stats.totalCompanyRevenue || 0).toLocaleString()} ETB`, icon: FiDollarSign, trend: '6.25% Net', color: 'green' },
    { label: 'Total Players', value: stats.totalUsers, icon: FiUsers, trend: 'All Time', color: 'amber' },
    { label: 'Active Games', value: stats.activeGames, icon: FiActivity, trend: 'Running Now', color: 'purple' },
  ] : [
    { label: 'My Players', value: stats.playerCount, icon: FiUsers, trend: '+5%', color: 'blue' },
    { label: 'Total Volume', value: `${(stats.totalDeposits || 0).toLocaleString()} ETB`, icon: FiTrendingUp, trend: '+18%', color: 'amber' },
    { label: 'Commission Balance', value: `${(stats.commissionBalance || 0).toLocaleString()} ETB`, icon: FiDollarSign, trend: 'Live', color: 'green' },
    { label: 'Total Earned', value: `${(stats.totalCommissionEarned || 0).toLocaleString()} ETB`, icon: FiUserCheck, trend: 'All-time', color: 'purple' },
  ];

  return (
    <div className="admin-page">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>
          Welcome, {user.firstName} 👋
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', marginTop: '4px' }}>
          Here is your {isAdmin ? 'platform' : 'branch'} performance overview.
        </p>
      </div>

      <div className="stat-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card-m">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--admin-accent)' }}>
                <card.icon size={24} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                {card.trend}
              </div>
            </div>
            <p className="stat-label">{card.label}</p>
            <h2 className="stat-value">{card.value}</h2>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
           <div className="data-table-container">
              <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <h3 style={{ margin: 0, fontWeight: '800' }}>Platform Health</h3>
              </div>
              <div style={{ padding: '30px' }}>
                 <div className="agent-flex-between" style={{ marginBottom: '1rem' }}>
                    <span className="agent-text-muted2">Total Deposited</span>
                    <span className="agent-text-white" style={{ fontWeight: 700 }}>{stats.totalDeposited.toLocaleString()} ETB</span>
                 </div>
                 <div className="agent-flex-between" style={{ marginBottom: '1rem' }}>
                    <span className="agent-text-muted2">Total Withdrawn</span>
                    <span className="agent-text-white" style={{ fontWeight: 700 }}>{stats.totalWithdrawn.toLocaleString()} ETB</span>
                 </div>
                 <div style={{ height: '1px', background: 'var(--admin-border)', margin: '1rem 0' }} />
                 <div className="agent-flex-between">
                    <span className="agent-text-muted2">Net Float</span>
                    <span className="agent-text-white" style={{ fontWeight: 900, color: '#4ade80', fontSize: '1.25rem' }}>{(stats.totalDeposited - stats.totalWithdrawn).toLocaleString()} ETB</span>
                 </div>
              </div>
           </div>

           <div className="data-table-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => window.location.href='/admin/agents'}>
              <div className={`agent-icon-badge blue`} style={{ width: '64px', height: '64px' }}>
                <FiUserCheck size={32} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '800' }}>Manage All Agents</h3>
                <p className="agent-subtitle">Manage branch balances and performance</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
