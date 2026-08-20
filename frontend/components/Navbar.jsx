'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'OVERVIEW' },
    { href: '/dashboard', label: 'MAIN NETWORK MAP' },
    { href: '/stations', label: 'STATIONS' },
    { href: '/alerts', label: 'ALERTS CONSOLE' },
  ];

  return (
    <header className="w-full bg-ocean-bg border-b border-ocean-border sticky top-0 z-50 rounded-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-ocean-mauve border border-ocean-peach flex items-center justify-center font-bold text-ocean-bg text-xl rounded-none shadow-[0_0_15px_rgba(162,117,142,0.4)]">
            A
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-ocean-light group-hover:text-ocean-peach transition-colors">
              AEGIS-RAIL
            </span>
            
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 font-mono text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 border transition-all rounded-none uppercase text-xs tracking-wider ${
                  isActive
                    ? 'bg-ocean-mauve text-ocean-bg font-bold border-ocean-peach shadow-[0_0_10px_rgba(162,117,142,0.4)]'
                    : 'bg-ocean-surface text-ocean-soft border-ocean-border hover:border-ocean-mauve hover:text-ocean-light'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-3 border border-ocean-border bg-ocean-surface px-3 py-1.5 rounded-none font-mono text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-ocean-peach opacity-75"></span>
            <span className="relative inline-flex rounded-none h-2.5 w-2.5 bg-ocean-mauve"></span>
          </span>
          
          <span className="text-ocean-peach font-bold">ONLINE</span>
        </div>
      </div>
    </header>
  );
}
