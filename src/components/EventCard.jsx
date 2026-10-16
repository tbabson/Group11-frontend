'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { rise } from './Motion';
import { bannerFor, fmtDate, fmtTime, isLive, titleCase, where } from '@/lib/format';

// Pulsing "LIVE NOW" pill for events in progress.
export function LiveBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 font-ui text-xs font-bold uppercase tracking-wider text-white shadow-lg ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      Live now
    </span>
  );
}

export default function EventCard({ event }) {
  const start = new Date(event.startAt);
  const live = isLive(event);
  return (
    <motion.article className="h-full" variants={rise} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link
        href={`/events/${event.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-navy/5 transition-shadow duration-500 hover:shadow-2xl hover:shadow-navy/15"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerFor(event)}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-cream/95 px-3 py-2 text-navy shadow-lg">
            <span className="font-ui text-[10px] font-semibold uppercase tracking-widest text-gold">
              {start.toLocaleDateString('en-GB', { month: 'short' })}
            </span>
            <span className="font-display text-2xl font-bold leading-none">{start.getDate()}</span>
          </div>
          <span className="absolute right-4 top-4 rounded-full bg-navy/70 px-3 py-1 font-ui text-xs font-semibold text-gold-soft backdrop-blur">
            {titleCase(event.category)}
          </span>
          {live && <LiveBadge className="absolute bottom-4 left-4" />}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="line-clamp-2 text-xl font-bold text-navy transition group-hover:text-gold">{event.title}</h3>
          <div className="mb-5 mt-3 space-y-1.5 text-sm text-charcoal/65">
            <p className="flex items-center gap-2">
              <Icon d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              {live ? `Started ${fmtTime(start)} · ends ${fmtTime(event.endAt)}` : `${fmtDate(start, { weekday: 'short' })} · ${fmtTime(start)}`}
            </p>
            <p className="flex items-center gap-2">
              <Icon d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <span className="truncate">{where(event)}</span>
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-mist pt-4">
            <span className="truncate text-sm text-charcoal/55">by {event.organizer?.name || 'Organizer'}</span>
            <span className="font-ui text-sm font-semibold text-gold transition group-hover:translate-x-1">View →</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
