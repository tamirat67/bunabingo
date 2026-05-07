import type { Metadata } from 'next';
import { ToastProvider } from '../components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Buna Bingo',
  description: 'Play Bingo and win real ETB prizes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Telegram Mini App SDK — must load synchronously before any JS runs */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
