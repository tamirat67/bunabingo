import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BunaBingo — Play & Win',
  description: 'Automated Bingo platform — Deposit, Play, Win instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
