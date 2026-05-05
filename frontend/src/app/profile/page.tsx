'use client';
import { useEffect, useState } from 'react';
import { getWallet } from '../../lib/api';
import { initTelegram } from '../../lib/telegram';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useRouter } from 'next/navigation';
import { User, Settings, Volume2, VolumeX, Moon, Sun, ShieldCheck, UserPlus, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Settings State
  const [soundOn, setSoundOn] = useState(true);
  const [theme, setTheme] = useState<'gold' | 'dark'>('gold');
  
  const { show } = useToast();

  useEffect(() => {
    initTelegram();
    
    // Load persisted settings
    const savedSound = localStorage.getItem('buna-sound') !== 'off';
    const savedTheme = (localStorage.getItem('buna-theme') as any) || 'gold';
    setSoundOn(savedSound);
    setTheme(savedTheme);

    const fetchData = async () => {
      try {
        const [userData, walletData] = await Promise.all([
          getMe(),
          getWallet()
        ]);
        setUser(userData);
        setWallet(walletData);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    localStorage.setItem('buna-sound', newVal ? 'on' : 'off');
    show(newVal ? 'Sound Enabled 🔊' : 'Sound Muted 🔇', 'info');
  };

  const toggleTheme = () => {
    const newVal = theme === 'gold' ? 'dark' : 'gold';
    setTheme(newVal);
    localStorage.setItem('buna-theme', newVal);
    show(`Theme set to ${newVal === 'gold' ? 'Royal Gold' : 'Dark Gray'}`, 'info');
    
    // Global Update
    if (newVal === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>LOADING BUNA...</span></div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-box">
          <div className="avatar-circle">
            <User size={48} />
          </div>
          <h2 className="user-name">{user?.firstName || 'Buna Player'}</h2>
          {user?.telegramUsername && (
            <div className="user-handle">@{user.telegramUsername}</div>
          )}
          <div className="badge-verified">
            <ShieldCheck size={14} /> Verified Member
          </div>
          <div className="profile-id-stack">
            <p className="user-id">TG ID: {user?.telegramId?.toString() || '...'}</p>
            <p className="user-id mini">BUNA ID: {user?.id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title"><Settings size={18} /> Game Preferences</h3>
        
        <div className="setting-toggle-row" onClick={toggleSound}>
          <div className="toggle-left">
            <div className="icon-wrap">
              {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <div className="toggle-info">
              <div className="title">Game Announcer</div>
              <div className="desc">Voice calls during live games</div>
            </div>
          </div>
          <div className={`toggle-switch ${soundOn ? 'on' : ''}`}></div>
        </div>

        <div className="setting-toggle-row" onClick={toggleTheme}>
          <div className="toggle-left">
            <div className="icon-wrap">
              {theme === 'gold' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div className="toggle-info">
              <div className="title">Display Mode</div>
              <div className="desc">{theme === 'gold' ? 'Royal Gold (Day)' : 'Dark Gray (Night)'}</div>
            </div>
          </div>
          <div className="toggle-btn-mini">Switch</div>
        </div>

        {/* Invite Friends Shortcut */}
        <div className="setting-toggle-row" onClick={() => router.push('/invite')}>
          <div className="toggle-left">
            <div className="icon-wrap invite">
              <UserPlus size={20} />
            </div>
            <div className="toggle-info">
              <div className="title">Invite & Earn</div>
              <div className="desc">Get bonus for every friend</div>
            </div>
          </div>
          <ChevronRight size={18} opacity={0.5} />
        </div>
      </div>

      <div className="stats-header">Performance Stats</div>
      <div className="stats-mini-row">
        <div className="mini-card">
          <div className="l">Total Games</div>
          <div className="v">{wallet?.totalGames || 0}</div>
        </div>
        <div className="mini-card">
          <div className="l">Win Rate</div>
          <div className="v">0%</div>
        </div>
      </div>

      <Navbar />

      <style jsx>{`
        .profile-container { min-height: 100vh; padding: 24px 16px 100px; transition: all 0.3s; background: var(--bg-main); color: var(--text-main); }

        .profile-header { text-align: center; margin-bottom: 35px; }
        .avatar-circle { width: 90px; height: 90px; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 3px solid var(--bg-nav); color: var(--text-main); }
        
        .user-name { font-size: 26px; font-weight: 900; margin: 0; }
        .badge-verified { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #22c55e; background: rgba(34, 197, 94, 0.1); padding: 4px 12px; border-radius: 99px; margin-top: 8px; }
        .user-id { font-size: 11px; opacity: 0.5; font-weight: 800; margin-top: 12px; font-family: monospace; letter-spacing: 1px; }

        .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; opacity: 0.7; }
        .setting-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 18px; background: var(--bg-card); border-radius: 20px; margin-bottom: 12px; border: 1px solid var(--border-light); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        
        .toggle-left { display: flex; align-items: center; gap: 16px; }
        .icon-wrap { width: 40px; height: 40px; background: var(--jackpot-bg); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--gold-accent); }
        .icon-wrap.invite { color: #22c55e; }
        
        .toggle-info .title { font-size: 15px; font-weight: 800; }
        .toggle-info .desc { font-size: 11px; opacity: 0.5; font-weight: 600; margin-top: 2px; }

        .toggle-switch { width: 46px; height: 26px; background: #e5e7eb; border-radius: 99px; position: relative; transition: 0.3s; }
        .toggle-switch.on { background: #22c55e; }
        .toggle-switch::after { content: ""; position: absolute; width: 20px; height: 20px; background: white; border-radius: 50%; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .toggle-switch.on::after { left: 23px; }

        .toggle-btn-mini { font-size: 11px; font-weight: 800; padding: 6px 12px; background: var(--jackpot-bg); border-radius: 8px; text-transform: uppercase; border: 1px solid var(--border-light); }

        .stats-header { font-size: 14px; font-weight: 800; text-transform: uppercase; margin-top: 30px; margin-bottom: 12px; opacity: 0.7; }
        .stats-mini-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mini-card { background: var(--bg-card); padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--border-light); }
        .mini-card .l { font-size: 10px; font-weight: 800; opacity: 0.5; text-transform: uppercase; margin-bottom: 4px; }
        .mini-card .v { font-size: 22px; font-weight: 900; }
      `}</style>
    </div>
  );
}
