'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, History, Wallet, UserCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname() ?? '';

  const navItems = [
    { label: 'Play',    href: '/',        icon: Home,       active: pathname === '/' || pathname.startsWith('/game') || pathname.startsWith('/tickets') },
    { label: 'Scores',  href: '/scores',  icon: Trophy,     active: pathname === '/scores' },
    { label: 'History', href: '/history', icon: History,    active: pathname === '/history' },
    { label: 'Wallet',  href: '/wallet',  icon: Wallet,     active: pathname === '/wallet' },
    { label: 'Profile', href: '/profile', icon: UserCircle, active: pathname === '/profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="nav-card">
        {navItems.map(({ label, href, icon: Icon, active }) => {
          const isActive = active;
          return (
            <Link key={label} href={href} className={`nav-tab ${isActive ? 'active' : ''}`}>
              <div className={`icon-wrap ${isActive ? 'icon-active' : ''}`}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>

              {isActive && <span className="active-bar" />}
            </Link>
          );
        })}
      </div>

    </nav>
  );
}

