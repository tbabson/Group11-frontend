'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { useAuth, homeFor } from '@/lib/auth';

// Pages whose top isn't a dark hero need a solid bar from the start.
const SOLID_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/#categories', label: 'Categories' },
  { href: '/#how', label: 'How it works' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || open || SOLID_PAGES.includes(pathname);
  const dashLabel = user?.role === 'attendee' ? 'My tickets' : 'Dashboard';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? 'bg-navy/95 shadow-lg shadow-navy-deep/30 backdrop-blur-md' : 'bg-gradient-to-b from-navy-deep/70 to-transparent'
      }`}
    >
      <nav className="container-x flex items-center justify-between py-4">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.href === pathname;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? 'text-gold' : 'text-cream/80 hover:text-gold-soft'
                  }`}
                >
                  {l.label}
                  {active && <motion.span layoutId="nav-dot" className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          {ready && user ? (
            <>
              <Link href={homeFor(user)} className="text-sm font-semibold text-cream/80 hover:text-gold-soft">
                {dashLabel}
              </Link>
              <button onClick={handleLogout} className="btn-outline !px-5 !py-2.5">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-cream/80 hover:text-gold-soft">
                Sign in
              </Link>
              <Link href="/register" className="btn-gold !px-5 !py-2.5">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-full p-2 text-cream lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-cream/10 lg:hidden"
          >
            <div className="container-x flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 font-semibold text-cream/90 hover:bg-navy-light">
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-3">
                {user ? (
                  <>
                    <Link href={homeFor(user)} className="btn-gold flex-1">
                      {dashLabel}
                    </Link>
                    <button onClick={handleLogout} className="btn-outline flex-1">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-outline flex-1">
                      Sign in
                    </Link>
                    <Link href="/register" className="btn-gold flex-1">
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
