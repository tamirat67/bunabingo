'use client';
import { useEffect, useState } from 'react';
import { getWallet } from '../../lib/api';
import { initTelegram } from '../../lib/telegram';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { Share2, Copy, Users, Gift } from 'lucide-react';

export default function InvitePage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  
  const botUsername = 'buna_bingobot'; // Configurable
  const userId = wallet?.user?.id || '';
  const refLink = `https://t.me/${botUsername}?start=${userId}`;

  useEffect(() => {
    initTelegram();
    getWallet()
      .then(setWallet)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refLink);
    show('Referral link copied! 📋', 'success');
  };

  const shareOnTelegram = () => {
    const text = `Join me on Buna Bingo! ☕🎯 Play Bingo and win real ETB instantly. Use my link to get a bonus! 🎁\n\n${refLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>LOADING INVITE HUB...</span></div>;

  return (
    <div className="invite-container">
      <div className="invite-hero">
        <div className="gift-icon-wrap">
          <Gift size={48} className="gift-icon" />
        </div>
        <h1 className="title">Invite & Earn</h1>
        <p className="subtitle">Invite your friends and get 10% bonus on their first deposit! 🎁</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <Users size={20} className="icon blue" />
          <div className="s-val">{wallet?.user?.referralCount || 0}</div>
          <div className="s-lbl">Friends Invited</div>
        </div>
        <div className="stat-card">
          <Gift size={20} className="icon gold" />
          <div className="s-val">0</div>
          <div className="s-lbl">Bonus Earned</div>
        </div>
      </div>

      <div className="link-section">
        <div className="link-header">Your Referral Link</div>
        <div className="link-box" onClick={copyToClipboard}>
          <span className="link-text">{refLink}</span>
          <Copy size={18} />
        </div>
        
        <div className="action-buttons">
          <button className="btn-invite primary" onClick={shareOnTelegram}>
            <Share2 size={20} /> Share with Friends
          </button>
          <button className="btn-invite secondary" onClick={copyToClipboard}>
             Copy My Link
          </button>
        </div>
      </div>

      <div className="how-it-works">
        <h3 className="section-title">How it works</h3>
        <div className="step-row">
          <div className="step-num">1</div>
          <div className="step-txt">Share your unique link with your friends.</div>
        </div>
        <div className="step-row">
          <div className="step-num">2</div>
          <div className="step-txt">Your friend joins and starts playing.</div>
        </div>
        <div className="step-row">
          <div className="step-num">3</div>
          <div className="step-txt">You receive a bonus instantly when they deposit!</div>
        </div>
      </div>

      <Navbar />

      
    </div>
  );
}

