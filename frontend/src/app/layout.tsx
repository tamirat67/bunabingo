'use client';
import { useEffect } from 'react';
import { ToastProvider } from '../components/Toast';
import Script from 'next/script';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme on initial load
    const savedTheme = localStorage.getItem('buna-theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Buna Bingo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Telegram Web App Script */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
        {/* Anti-Crash Self-Repair Script */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            console.log('Detected crash, repairing...');
            if (!window.hasRepaired) {
              window.hasRepaired = true;
              setTimeout(() => window.location.reload(true), 1000);
            }
          });
          setTimeout(() => {
            if (!document.querySelector('.buna-bunker') && !document.querySelector('.splash-container')) {
              console.log('App hung, force reloading...');
              window.location.href = window.location.href + '&retry=1';
            }
          }, 8000);
        `}} />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
