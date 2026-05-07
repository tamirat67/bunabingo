'use client';
import { useState } from 'react';
import { register } from '../lib/api';
import { useToast } from './Toast';
import { ShieldCheck, Phone, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onSuccess: () => void;
}

export default function Onboarding({ onSuccess }: OnboardingProps) {
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const handleRequestContact = () => {
    if (typeof window === 'undefined' || !(window as any).Telegram?.WebApp) {
      show('Telegram environment not found', 'error');
      return;
    }

    const twa = (window as any).Telegram.WebApp;
    setLoading(true);
    
    twa.requestContact(async (res: any) => {
      if (res.status === 'sent') {
        try {
          const phoneNumber = res.response_data?.phone_number || res.phone_number;
          const startParam = new URLSearchParams(twa.initData).get('start_param');
          
          await register({ phoneNumber, referredById: startParam || undefined });
          show('Verification Successful! Welcome ☕', 'success');
          onSuccess();
        } catch (err) {
          show('Registration failed. Try again.', 'error');
        } finally {
          setLoading(false);
        }
      } else {
        show('Verification required to play', 'info');
        setLoading(false);
      }
    });
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-sheet">
        <div className="sheet-handle"></div>
        
        <div className="sheet-content">
          <div className="icon-badge">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="sheet-title">Verify Your Account</h2>
          <p className="sheet-desc">
            To ensure fair play and secure payouts of your winnings, we require a one-time verification via your Telegram contact.
          </p>

          <div className="perks-list">
            <div className="perk">✅ Secure ETB Payouts</div>
            <div className="perk">✅ Verified Fair Play</div>
            <div className="perk">✅ Real-Money Bingo</div>
          </div>

          <button 
            className={`btn-verify ${loading ? 'loading' : ''}`} 
            onClick={handleRequestContact}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner-small"></div>
            ) : (
              <>
                <Phone size={20} />
                <span>SHARE CONTACT & JOIN</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
          
          <p className="privacy-note">We only use your contact for account verification.</p>
        </div>
      </div>

    </div>
  );
}

