'use client';
import { useEffect, useState } from 'react';
import { getWallet, getMe } from '../../lib/api';
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

      
    </div>
  );
}

