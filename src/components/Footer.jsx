import Link from 'next/link';
import Logo from './Logo';
import { SITE } from '@/lib/site';

const COLUMNS = [
  {
    title: 'Discover',
    links: [
      ['All events', '/events'],
      ['Free events', '/events?isFree=true'],
      ['Conferences', '/events?category=conference'],
      ['Galas', '/events?category=gala'],
    ],
  },
  {
    title: 'Organizers',
    links: [
      ['Host an event', '/register?role=organizer'],
      ['Organizer dashboard', '/organizer'],
      ['Payouts', '/organizer/payouts'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Sign in', '/login'],
      ['Create account', '/register'],
      ['My tickets', '/dashboard'],
      ['Reset password', '/forgot-password'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="navy-texture border-t border-gold/20 text-cream">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-5 max-w-sm text-cream/60">
            {SITE.tagline} Discover galas, conferences, weddings and VIP experiences, or host your own with secure
            ticketing and QR check-in.
          </p>
          <div className="mt-6 h-px w-24 bg-gradient-to-r from-gold to-transparent" />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-ui text-sm font-semibold uppercase tracking-[0.2em] text-gold">{col.title}</h4>
            <ul className="mt-5 space-y-3">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-cream/70 transition hover:text-gold-soft">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-sm text-cream/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} {SITE.suffix}. All rights reserved.
          </p>
          <p>Payments secured by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
