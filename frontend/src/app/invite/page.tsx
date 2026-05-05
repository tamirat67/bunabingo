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

      <style jsx>{`
        .invite-container { min-height: 100vh; background: var(--bg-main); padding: 24px 16px 100px; color: var(--text-main); transition: all 0.3s; }
        .invite-hero { text-align: center; margin-bottom: 30px; }
        .gift-icon-wrap { width: 80px; height: 80px; background: var(--bg-nav); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .title { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
        .subtitle { font-size: 14px; font-weight: 700; opacity: 0.7; max-width: 250px; margin: 0 auto; line-height: 1.4; }
        
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; }
        .stat-card { background: var(--bg-card); padding: 20px 12px; border-radius: 20px; text-align: center; border: 1.5px solid var(--border-light); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .stat-card .icon { margin-bottom: 8px; }
        .stat-card .s-val { font-size: 22px; font-weight: 900; }
        .stat-card .s-lbl { font-size: 10px; font-weight: 800; opacity: 0.5; text-transform: uppercase; margin-top: 4px; }
        .icon.blue { color: #3b82f6; }
        .icon.gold { color: var(--gold-accent); }

        .link-section { background: var(--bg-nav); border-radius: 24px; padding: 24px; color: white; box-shadow: 0 15px 30px rgba(0,0,0,0.2); margin-bottom: 30px; }
        .link-header { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; opacity: 0.6; letter-spacing: 1px; }
        .link-box { background: rgba(0,0,0,0.2); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
        .link-text { font-size: 13px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 12px; }
        
        .action-buttons { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .btn-invite { border: none; padding: 14px; border-radius: 14px; font-weight: 900; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.2s; }
        .btn-invite.primary { background: var(--bg-main); color: var(--text-main); }
        .btn-invite.secondary { background: transparent; color: white; border: 1px solid rgba(255, 255, 255, 0.3); }
        .btn-invite:active { transform: scale(0.98); }

        .how-it-works { background: var(--jackpot-bg); border-radius: 20px; padding: 20px; border: 1.5px solid var(--border-light); }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 16px; color: var(--gold-accent); }
        .step-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
        .step-num { width: 28px; height: 28px; background: var(--bg-nav); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; }
        .step-txt { font-size: 13px; font-weight: 700; opacity: 0.8; }
      `}</style>
    </div>
  );
}
