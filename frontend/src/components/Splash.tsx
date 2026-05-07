'use client';
import { useEffect, useState } from 'react';

interface SplashProps {
  onFinish: () => void;
  isLoading: boolean;
}

export default function Splash({ onFinish, isLoading }: SplashProps) {
  const [fading, setFading] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    // Ensure the splash screen shows for at least 1.5 seconds for the "boom" effect
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If loading is done AND minimum time has passed, start fading out
    if (!isLoading && minTimePassed) {
      setFading(true);
      const timer = setTimeout(() => {
        onFinish();
      }, 400); // Wait for fade-out animation to complete
      return () => clearTimeout(timer);
    }
  }, [isLoading, minTimePassed, onFinish]);

  return (
    <div className={`splash-container ${fading ? 'fade-out' : ''}`}>
      <div className="logo-boom">
        <div className="center-content">
          <img src="/logo.jpg" alt="Buna Bingo Logo" className="brand-logo" />
          <h2 className="motto">Buna Bingo</h2>
          <p className="sub-motto">Wake Up to a Jackpot ☀️</p>
        </div>
      </div>

    </div>
  );
}

