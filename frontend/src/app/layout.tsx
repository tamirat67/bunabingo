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
      </head>
      <body>
        {/*
          Load Telegram WebApp SDK AFTER page renders.
          Inside Telegram WebView the object is already injected natively;
          this script is only needed when testing in a regular browser.
          beforeInteractive would block rendering and cause Telegram to show
          "This page couldn't load".
        */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
