'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',         icon: '💰', label: 'Wallet' },
  { href: '/tickets',  icon: '🎫', label: 'Play'   },
  { href: '/history',  icon: '📊', label: 'History' },
  { href: '/deposit',  icon: '📥', label: 'Deposit' },
  { href: '/withdraw', icon: '💸', label: 'Cash Out' },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="bot-nav">
      {LINKS.map(l => (
        <Link key={l.href} href={l.href} className={`nav-item${path === l.href ? ' active' : ''}`}>
          <span style={{ fontSize: 22 }}>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
