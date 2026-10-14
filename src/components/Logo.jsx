import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`} aria-label={`${SITE.name} home`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-navy-deep/40">
        <span className="font-display text-lg font-bold text-gold transition group-hover:scale-110">{SITE.name[0]}</span>
      </span>
      <span className="font-display text-xl font-bold tracking-wide text-cream">
        {SITE.name}
        <span className="ml-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.3em] text-gold">{SITE.suffix}</span>
      </span>
    </Link>
  );
}
