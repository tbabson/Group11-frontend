'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Reveal, Stagger, rise } from '@/components/Motion';
import { Alert, Modal, PageLoader, Spinner } from '@/components/UI';
import TicketQR from '@/components/TicketQR';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bannerFor, fmtDate, fmtTime, isLive, money, titleCase, where } from '@/lib/format';
import { LiveBadge } from '@/components/EventCard';

export default function EventPage() {
  const { slug } = useParams();
  const { user, ready } = useAuth();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [myRegs, setMyRegs] = useState([]);

  const load = useCallback(() => {
    api(`/events/${slug}`)
      .then(({ data }) => setEvent(data))
      .catch((err) => setError(err));
  }, [slug]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // The signed-in attendee's tickets for this event (they can hold several and buy more).
  useEffect(() => {
    if (!event || user?.role !== 'attendee') return setMyRegs([]);
    api('/me/registrations', { query: { limit: 50 } })
      .then(({ data }) => setMyRegs(data.filter((r) => r.event?._id === event._id && r.status !== 'cancelled')))
      .catch(() => {});
  }, [event, user]);

  if (error) {
    return (
      <div className="navy-texture flex min-h-screen flex-col items-center justify-center px-4 text-center text-cream">
        <p className="eyebrow">{error.status === 404 ? '404' : 'Error'}</p>
        <h1 className="mt-4 text-5xl font-black">{error.status === 404 ? 'Event not found' : 'Something went wrong'}</h1>
        <p className="mt-4 text-cream/60">{error.status === 404 ? 'It may have been removed or is not public yet.' : error.message}</p>
        <Link href="/events" className="btn-gold mt-8">
          Browse events
        </Link>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="navy-texture min-h-screen pt-24">
        <PageLoader label="Preparing your experience…" />
      </div>
    );
  }

  const isOwner = user && (user.role === 'admin' || event.organizer?._id === user._id);

  return (
    <div className="bg-navy-deep text-cream">
      <Hero event={event} isOwner={isOwner} />
      <Statement event={event} />
      <About event={event} />
      <Highlights event={event} />
      <Host event={event} />
      <Timeline event={event} />
      <Tickets event={event} user={user} myRegs={myRegs} onChange={load} />
      <Included />
      <WhyAttend />
      <Faq event={event} />
      <ClosingCta event={event} />
    </div>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    done: diff === 0,
    parts: [
      ['Days', Math.floor(diff / 86400000)],
      ['Hours', Math.floor((diff / 3600000) % 24)],
      ['Mins', Math.floor((diff / 60000) % 60)],
      ['Secs', Math.floor((diff / 1000) % 60)],
    ],
  };
}

function Hero({ event, isOwner }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const { done, parts } = useCountdown(event.startAt);
  const city = event.venue?.city || (event.onlineUrl ? 'Online' : '');
  const dateLabel =
    start.toDateString() === end.toDateString()
      ? fmtDate(start, { year: undefined }).toUpperCase()
      : `${start.getDate()} – ${fmtDate(end, { year: undefined }).toUpperCase()}`;

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerFor(event)})`, y, scale: 1.1 }} />
      <div className="absolute inset-0 bg-navy-deep/55 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/80 via-navy/60 to-navy-deep" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(212_160_23/0.25),transparent_55%)]" />

      <div className="container-x relative z-10 flex flex-1 flex-col pb-12 pt-28">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between font-ui text-xs font-semibold uppercase tracking-[0.25em] text-cream/85 sm:text-sm"
        >
          <span>{[city, titleCase(event.category)].filter(Boolean).join(' · ')}</span>
          <span className="text-gold">{dateLabel}</span>
        </motion.div>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          {event.status === 'published' && isLive(event) && <LiveBadge className="mb-6" />}
          {event.status !== 'published' && (
            <span className="mb-6 rounded-full bg-gold/20 px-4 py-1.5 font-ui text-xs font-semibold uppercase tracking-widest text-gold-soft ring-1 ring-gold/40">
              {event.status === 'draft' ? 'Draft preview' : event.status}
            </span>
          )}
          <motion.h1
            style={{ scale: titleScale }}
            initial={{ opacity: 0, y: 50, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl text-[2.6rem] font-black uppercase leading-[0.9] tracking-tight [overflow-wrap:anywhere] min-[420px]:text-5xl sm:text-7xl lg:text-[7.5rem]"
          >
            {event.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {event.status === 'published' && !done && (
              <a href="#tickets" className="btn-gold">
                Get tickets
              </a>
            )}
            {isOwner && (
              <Link href={`/organizer/events/${event.slug}`} className="btn-outline">
                Manage event
              </Link>
            )}
          </motion.div>

          {!done && event.status === 'published' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-12 grid grid-cols-4 gap-2 sm:gap-4"
              aria-label="Countdown to the event"
            >
              {parts.map(([label, value]) => (
                <div key={label} className="min-w-16 rounded-2xl border border-gold/25 bg-navy-deep/50 px-3 py-3 backdrop-blur sm:min-w-20">
                  <div className="font-display text-2xl font-bold tabular-nums text-cream sm:text-3xl">{String(value).padStart(2, '0')}</div>
                  <div className="font-ui text-[10px] uppercase tracking-widest text-gold">{label}</div>
                </div>
              ))}
            </motion.div>
          )}
          {event.status === 'published' && isLive(event) && (
            <p className="mt-10 font-ui text-sm uppercase tracking-[0.25em] text-gold-soft">
              In progress · ends {fmtTime(event.endAt)}
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col items-center gap-3 border-t border-cream/10 pt-6 text-center"
        >
          <p className="font-ui text-[11px] uppercase tracking-[0.3em] text-cream/50">Hosted by</p>
          <p className="font-display text-xl font-semibold text-gold-soft">{event.organizer?.name || 'The organizer'}</p>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------- statement ------------------------------- */

function Statement({ event }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.4'] });
  const text = firstSentence(event.description) || `${event.title}: an experience designed to be remembered.`;
  const words = text.split(' ');
  const days = eventDays(event);
  const seatsLeft = event.ticketTypes.reduce((n, t) => n + t.available, 0);

  const stats = [
    [event.capacity.toLocaleString(), 'Guest capacity'],
    [`${event.ticketTypes.length}`, event.ticketTypes.length === 1 ? 'Ticket tier' : 'Ticket tiers'],
    [`${seatsLeft.toLocaleString()}`, 'Seats remaining'],
    [`${days}`, days === 1 ? 'Day' : 'Days'],
  ];

  return (
    <section className="py-24">
      <div className="container-x">
        <p ref={ref} className="max-w-5xl text-3xl font-bold uppercase leading-tight sm:text-5xl">
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>
        <Stagger className="mt-16 grid grid-cols-2 gap-8 border-t border-cream/10 pt-10 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <motion.div key={label} variants={rise}>
              <div className="font-display text-4xl font-bold text-cream sm:text-5xl">
                {value}
                <span className="text-gold">.</span>
              </div>
              <div className="mt-1 text-sm text-cream/55">{label}</div>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  );
}

function firstSentence(text = '') {
  const s = text.trim().split(/(?<=[.!?])\s/)[0] || '';
  return s.length > 180 ? `${s.slice(0, 177)}…` : s;
}

/* ---------------------------------- about --------------------------------- */

function About({ event }) {
  const paragraphs = (event.description || '').split(/\n+/).filter(Boolean);
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep via-navy to-navy-deep" />
      <div className="container-x relative grid gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-4">About the event</p>
          <h2 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            {titleCase(event.category)}
            <br />
            <span className="gold-text">experience</span>
          </h2>
          <div className="mt-8 overflow-hidden rounded-3xl ring-1 ring-gold/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerFor(event)} alt="" className="aspect-video w-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.15} className="flex flex-col justify-center gap-5 text-lg leading-relaxed text-cream/75">
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p>Details for this event will be shared soon.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full border border-gold/30 px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wider text-gold-soft">
              {titleCase(event.category)}
            </span>
            <span className="rounded-full border border-gold/30 px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wider text-gold-soft">
              {event.refundPolicy === 'full' ? 'Fully refundable' : 'Non-refundable'}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- highlights ------------------------------- */

const ICONS = {
  calendar: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zm-3 9l2 2 4-4',
  users: 'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87M14 4.13a4 4 0 010 7.75M10 7a4 4 0 11-8 0 4 4 0 018 0z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z',
  check: 'M5 13l4 4L19 7',
};

function Icon({ name, className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Highlights({ event }) {
  const venue = event.venue || {};
  const cards = [
    { icon: 'calendar', title: 'Date & time', text: `${fmtDate(event.startAt, { weekday: 'long' })}, ${fmtTime(event.startAt)} until ${fmtDate(event.endAt)} ${fmtTime(event.endAt)}.` },
    {
      icon: 'pin',
      title: event.onlineUrl && !venue.name ? 'Online' : 'Venue',
      text: [venue.name, venue.address, venue.city].filter(Boolean).join(', ') || 'Join online. The link is shared with ticket holders.',
    },
    {
      icon: 'shield',
      title: 'Refund policy',
      text: event.refundPolicy === 'full' ? 'Cancel your paid ticket before the event and receive a full refund.' : 'Tickets are non-refundable unless the organizer cancels the event.',
    },
  ];

  return (
    <section className="py-24">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow mb-3">Event highlights</p>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">Everything at a glance</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={rise} className="relative min-h-72 overflow-hidden rounded-3xl ring-1 ring-gold/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerFor(event)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/60 to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl font-black uppercase leading-tight">
              Moments that <span className="text-gold">define</span> the year
            </p>
          </motion.div>
          {cards.map((c) => (
            <motion.div
              key={c.title}
              variants={rise}
              whileHover={{ y: -6, borderColor: 'rgba(212,160,23,0.6)' }}
              className="flex flex-col rounded-3xl border border-cream/10 bg-navy/60 p-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                <Icon name={c.icon} />
              </span>
              <h3 className="mt-6 text-2xl font-bold">{c.title}</h3>
              <p className="mt-3 text-cream/65">{c.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------------------------- host ---------------------------------- */

function Host({ event }) {
  const name = event.organizer?.name || 'The organizer';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <section className="py-16">
      <div className="container-x">
        <Reveal className="grid items-center gap-10 rounded-[2rem] border border-gold/20 bg-gradient-to-br from-navy to-navy-deep p-8 sm:p-12 md:grid-cols-[auto_1fr_auto]">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-soft font-display text-4xl font-black text-navy shadow-xl shadow-gold/20">
            {initials}
          </div>
          <div>
            <p className="eyebrow mb-2">Your host</p>
            <h2 className="text-3xl font-black uppercase sm:text-4xl">{name}</h2>
            <p className="mt-3 max-w-xl text-cream/65">
              Curating this {event.category} experience for {event.capacity.toLocaleString()} guests. Tickets are issued securely and checked at the
              door with your personal QR code.
            </p>
          </div>
          <a href="#tickets" className="btn-gold justify-self-start md:justify-self-end">
            Reserve a seat
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------- timeline -------------------------------- */

const DAY_IMAGES = ['/images/stage.jpg', '/images/hall.jpg', '/images/gala.jpg', '/images/party.jpg'];

const eventDays = (event) => Math.max(1, Math.ceil((new Date(event.endAt) - new Date(event.startAt)) / 86400000));

function buildDays(event) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  // Count by duration, so an evening that runs past midnight is still one day.
  const count = Math.min(7, eventDays(event));
  const days = [];
  for (let i = 0; i < count; i += 1) {
    const cursor = new Date(start.getTime() + i * 86400000);
    const isFirst = i === 0;
    const isLast = i === count - 1;
    const items = [];
    if (isFirst) items.push([fmtTime(start), 'Doors open & welcome', 'Arrive, check in with your QR ticket and settle in.']);
    items.push([isFirst ? 'Main' : 'All day', isFirst ? 'Opening programme' : 'Full programme', 'Sessions, performances and moments curated by the host.']);
    if (!isLast) items.push(['Evening', 'Networking & receptions', 'Unwind and connect with fellow guests.']);
    if (isLast) items.push([fmtTime(end), 'Closing', 'Final remarks and farewells.']);
    days.push({ date: cursor, items });
  }
  return days;
}

const ordinal = (n) => (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

function Timeline({ event }) {
  const days = buildDays(event);
  return (
    <section className="py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <p className="eyebrow mb-3">The programme</p>
          <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase leading-tight sm:text-5xl">
            {days.length === 1 ? 'One day' : `${days.length} days`} to remember
          </h2>
          <p className="mt-3 text-cream/55">Where moments become memories</p>
        </Reveal>
        <div className="mt-14 space-y-6">
          {days.map((day, i) => (
            <Reveal key={i} delay={0.05} className="grid overflow-hidden rounded-3xl border border-cream/10 bg-navy/50 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="relative min-h-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={DAY_IMAGES[i % DAY_IMAGES.length]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-transparent to-navy-deep/90" />
                <span className="absolute left-6 top-5 font-display text-4xl font-black uppercase">Day {i + 1}</span>
                <div className="absolute bottom-5 left-6">
                  <p className="font-display text-2xl font-bold uppercase text-gold">
                    {day.date.getDate()}
                    <sup>{ordinal(day.date.getDate())}</sup> {day.date.toLocaleDateString('en-GB', { month: 'short' })}
                  </p>
                  <p className="text-sm text-cream/60">{where(event)}</p>
                </div>
              </div>
              <ul className="divide-y divide-cream/10 p-6 sm:p-8">
                {day.items.map(([time, title, text]) => (
                  <li key={title} className="grid grid-cols-[5rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="font-ui text-sm font-semibold text-gold">{time}</span>
                    <div>
                      <h4 className="font-sans text-lg font-semibold">{title}</h4>
                      <p className="text-sm text-cream/55">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- tickets -------------------------------- */

const PERKS = {
  free: ['General admission', 'Digital QR ticket', 'Event reminders'],
  regular: ['General admission', 'Digital QR ticket', 'Access to all sessions', 'Networking areas'],
  vip: ['Priority entry', 'Premium seating', 'VIP lounge access', 'Complimentary refreshments', 'Meet the host'],
};

function saleState(t, event) {
  const now = new Date();
  if (event.status !== 'published') return { label: event.status === 'draft' ? 'Not published' : `Event ${event.status}`, open: false };
  // Tickets can't be bought once the event has started.
  if (now >= new Date(event.endAt)) return { label: 'Event ended', open: false };
  if (now >= new Date(event.startAt)) return { label: 'Happening now', open: false };
  if (now < new Date(t.saleStart)) return { label: `Sales open ${fmtDate(t.saleStart)}`, open: false };
  if (now > new Date(t.saleEnd)) return { label: 'Sales ended', open: false };
  if (t.available === 0) return { label: 'Join waitlist', open: true, waitlist: true };
  return { label: t.price ? 'Get ticket' : 'Reserve free', open: true };
}

// Most tickets in one order (the API enforces the same limit).
const MAX_PER_ORDER = 10;

function Tickets({ event, user, myRegs, onChange }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [qty, setQty] = useState({}); // ticketTypeId -> quantity chosen

  const held = myRegs.filter((r) => ['confirmed', 'checked-in', 'pending', 'waitlisted'].includes(r.status));

  // Arriving from /payments/callback?…→ /events/:slug?paid=1: show the tickets of the order
  // just paid for, then drop the flag so a refresh doesn't reopen it.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('paid') !== '1') return;
    const confirmed = myRegs.filter((r) => ['confirmed', 'checked-in'].includes(r.status));
    if (!confirmed.length) return;
    const latest = confirmed[0]; // newest first
    const order = confirmed.filter((r) => (latest.order ? r.order === latest.order : r._id === latest._id));
    setResult({
      status: 'confirmed',
      ticket: latest.ticketType || {},
      tickets: order.map((r) => ({ registrationId: r._id, qrToken: r.qrToken, status: r.status })),
    });
    router.replace(`/events/${event.slug}`, { scroll: false });
  }, [myRegs, event.slug, router]);

  const quantityFor = (t) => qty[t._id] || 1;
  const maxFor = (t) => Math.max(1, Math.min(MAX_PER_ORDER, t.available || MAX_PER_ORDER));
  const setQuantity = (t, n) => setQty((q) => ({ ...q, [t._id]: Math.min(maxFor(t), Math.max(1, n)) }));

  const register = async (ticket) => {
    setError('');
    if (!user) return router.push(`/login?next=${encodeURIComponent(`/events/${event.slug}#tickets`)}`);
    if (user.role !== 'attendee') return setError('Only attendee accounts can buy tickets. Sign in with an attendee account to register.');
    setBusy(ticket._id);
    try {
      const quantity = quantityFor(ticket);
      const { data } = await api(`/events/${event._id}/register`, { method: 'POST', body: { ticketTypeId: ticket._id, quantity } });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setResult({ ...data, ticket, tickets: data.tickets || [{ registrationId: data.registrationId, qrToken: data.qrToken, status: data.status }] });
      setQty((q) => ({ ...q, [ticket._id]: 1 }));
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const sorted = [...event.ticketTypes].sort((a, b) => a.price - b.price);
  const featured = sorted.length > 1 ? sorted[sorted.length - 1]._id : null;

  return (
    <section id="tickets" className="relative scroll-mt-20 overflow-hidden py-24">
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_center,rgb(212_160_23/0.12),transparent_60%)]" />
      <div className="container-x relative">
        <Reveal className="text-center">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">Ticket prices</h2>
          <p className="mx-auto mt-3 max-w-md text-cream/55">Secure your place at the event. Paid seats are held for 15 minutes while you complete payment.</p>
        </Reveal>

        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {held.length > 0 && (
            <Alert kind="info">
              You hold {held.length === 1 ? 'a ticket' : `${held.length} tickets`} for this event. You can buy more below.{' '}
              <Link href="/dashboard" className="font-semibold underline">
                View in My tickets
              </Link>
            </Alert>
          )}
          <Alert>{error}</Alert>
        </div>

        {sorted.length === 0 ? (
          <p className="mt-12 text-center text-cream/60">Tickets have not been released yet.</p>
        ) : (
          <Stagger className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-6">
            {sorted.map((t) => {
              const state = saleState(t, event);
              const pct = t.quantity ? Math.min(100, Math.round((t.sold / t.quantity) * 100)) : 0;
              const isFeatured = t._id === featured;
              return (
                <motion.div
                  key={t._id}
                  variants={rise}
                  whileHover={{ y: -10 }}
                  className={`relative w-full max-w-sm overflow-hidden rounded-3xl p-[1px] ${
                    isFeatured ? 'bg-gradient-to-b from-gold via-gold/40 to-gold/10' : 'bg-gradient-to-b from-cream/25 to-cream/5'
                  }`}
                >
                  <div className="flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-gradient-to-b from-navy to-navy-deep p-8">
                    <div className="flex items-center justify-between">
                      <span className="font-ui text-xs font-semibold uppercase tracking-[0.25em] text-cream/60">{t.name}</span>
                      {isFeatured && <span className="rounded-full bg-gold px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-wider text-navy">Premium</span>}
                    </div>
                    <div className="mt-4 font-display text-5xl font-black">{money(t.price, t.currency)}</div>
                    <p className="mt-1 text-sm text-cream/50">{t.kind === 'vip' ? 'VIP' : titleCase(t.kind)} pass</p>

                    <p className="mt-6 font-ui text-xs font-semibold uppercase tracking-widest text-gold">Includes</p>
                    <ul className="mt-3 space-y-2.5">
                      {(PERKS[t.kind] || PERKS.regular).map((perk) => (
                        <li key={perk} className="flex items-center gap-3 text-sm text-cream/80">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold">
                            <Icon name="check" className="h-3 w-3" />
                          </span>
                          {perk}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-cream/50">
                        <span>{t.available > 0 ? `${t.available} left` : 'Sold out'}</span>
                        <span>Sales end {fmtDate(t.saleEnd)}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {state.open && (
                      <div className="mt-8 flex items-center justify-between">
                        <span className="font-ui text-xs font-semibold uppercase tracking-widest text-cream/60">Quantity</span>
                        <div className="flex items-center gap-1 rounded-full bg-cream/10 p-1" role="group" aria-label={`${t.name} quantity`}>
                          <button
                            type="button"
                            onClick={() => setQuantity(t, quantityFor(t) - 1)}
                            disabled={quantityFor(t) <= 1 || busy}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-cream hover:bg-cream/15 disabled:opacity-30"
                            aria-label="One fewer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-display text-lg font-bold" aria-live="polite">
                            {quantityFor(t)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(t, quantityFor(t) + 1)}
                            disabled={quantityFor(t) >= maxFor(t) || busy}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-cream hover:bg-cream/15 disabled:opacity-30"
                            aria-label="One more"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => register(t)}
                      disabled={!state.open || busy}
                      className={`${state.open ? 'mt-4' : 'mt-8'} w-full ${isFeatured ? 'btn-gold' : 'btn bg-cream text-navy hover:bg-gold-soft'}`}
                    >
                      {busy === t._id ? <Spinner className="h-4 w-4" /> : null}
                      {state.open && quantityFor(t) > 1 && !state.waitlist
                        ? `${t.price ? 'Get' : 'Reserve'} ${quantityFor(t)} tickets${t.price ? ` · ${money(t.price * quantityFor(t), t.currency)}` : ''}`
                        : state.label}
                    </button>
                    {state.open && <p className="mt-2 text-center text-[11px] text-cream/40">Up to {MAX_PER_ORDER} per order · each ticket gets its own QR code</p>}

                    <Barcode seed={t._id} />
                  </div>
                </motion.div>
              );
            })}
          </Stagger>
        )}
      </div>

      <Modal open={Boolean(result)} onClose={() => setResult(null)} title={result?.status === 'waitlisted' ? "You're on the waitlist" : "You're going!"}>
        {result?.status === 'waitlisted' ? (
          <p className="text-charcoal/70">
            The <strong>{result.ticket.name}</strong> tier is sold out, so you&apos;ve been added to the waitlist. If a seat frees up you&apos;ll be
            promoted automatically and notified by email.
          </p>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-charcoal/70">
              {result?.tickets?.length > 1 ? (
                <>
                  Your <strong>{result.tickets.length} {result?.ticket.name}</strong> tickets for <strong>{event.title}</strong> are confirmed. Each
                  guest shows their own code at the door; each code works once.
                </>
              ) : (
                <>
                  Your <strong>{result?.ticket.name}</strong> ticket for <strong>{event.title}</strong> is confirmed. Show this code at the door.
                </>
              )}
            </p>
            <div className={result?.tickets?.length > 1 ? 'max-h-[60vh] space-y-8 overflow-y-auto pr-1' : ''}>
              {(result?.tickets || []).map((t, i, all) => (
                <div key={t.registrationId || i}>
                  {all.length > 1 && (
                    <p className="mb-3 font-ui text-xs font-semibold uppercase tracking-widest text-charcoal/50">
                      Ticket {i + 1} of {all.length}
                    </p>
                  )}
                  <TicketQR
                    token={t.qrToken}
                    ticket={{ event, ticketType: result?.ticket, holder: user?.name, status: t.status }}
                    filename={all.length > 1 ? `ticket-${event.slug}-${i + 1}.png` : `ticket-${event.slug}.png`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <Link href="/dashboard" className="btn-navy mt-8 w-full">
          Go to My tickets
        </Link>
      </Modal>
    </section>
  );
}

// Decorative barcode, like a printed ticket stub.
function Barcode({ seed }) {
  const bars = [...String(seed)].map((c) => (c.charCodeAt(0) % 3) + 1);
  return (
    <div className="mt-8 border-t border-dashed border-cream/15 pt-5">
      <div className="flex h-10 items-stretch gap-[2px] opacity-60" aria-hidden="true">
        {[...bars, ...bars].map((w, i) => (
          <span key={i} className="bg-cream" style={{ width: w, opacity: i % 4 === 0 ? 0.4 : 1 }} />
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-[0.3em] text-cream/40">{String(seed).slice(-12).toUpperCase()}</p>
    </div>
  );
}

/* -------------------------------- included -------------------------------- */

const INCLUDED = [
  ['Instant QR ticket', 'Your ticket is emailed and saved to your dashboard the moment it is confirmed.'],
  ['Secure checkout', 'Payments are processed by Paystack. Your seat is held while you pay.'],
  ['Automatic waitlist', 'Sold out? Join the waitlist and get promoted the moment a seat frees up.'],
  ['Timely reminders', 'We email you 24 hours before the doors open so you never miss a moment.'],
  ['Fast check-in', 'One scan at the entrance. Each ticket is valid exactly once.'],
];

function Included() {
  return (
    <section className="py-24">
      <div className="container-x grid gap-14 lg:grid-cols-[2fr_3fr]">
        <Reveal>
          <p className="eyebrow mb-4">Your pass</p>
          <h2 className="text-4xl font-black uppercase leading-tight sm:text-5xl">What&apos;s included in your pass</h2>
          <p className="mt-5 text-cream/60">Every ticket is more than entry. It is a seamless experience from booking to the final applause.</p>
        </Reveal>
        <Stagger className="space-y-4">
          {INCLUDED.map(([title, text], i) => (
            <motion.div key={title} variants={rise} className="flex gap-5 rounded-2xl border border-cream/10 bg-navy/40 p-5 transition hover:border-gold/40">
              <span className="font-display text-2xl font-bold text-gold">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-ui text-base font-semibold uppercase tracking-wider">{title}</h3>
                <p className="mt-1 text-sm text-cream/60">{text}</p>
              </div>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------- why attend ------------------------------- */

const WHY = [
  ['users', 'Exceptional company', 'Share the room with people who care about the same things you do.'],
  ['star', 'Curated moments', 'Every detail is planned so you can simply arrive and enjoy.'],
  ['calendar', 'Memories that last', 'Leave with stories, connections and a few photos worth framing.'],
  ['shield', 'Booked with confidence', 'Verified tickets, secure payments and clear refund terms.'],
];

function WhyAttend() {
  return (
    <section className="py-24">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow mb-3">Why attend</p>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">Why should you attend?</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {WHY.map(([icon, title, text]) => (
            <motion.div
              key={title}
              variants={rise}
              className="group relative overflow-hidden rounded-3xl border border-cream/10 bg-gradient-to-br from-navy to-navy-deep p-8"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/25" />
              <span className="text-gold">
                <Icon name={icon} className="h-8 w-8" />
              </span>
              <h3 className="mt-5 text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-cream/60">{text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ----------------------------------- faq ---------------------------------- */

function Faq({ event }) {
  const items = [
    ['When and where is the event?', `${fmtDate(event.startAt, { weekday: 'long' })} at ${fmtTime(event.startAt)} until ${fmtDate(event.endAt)} ${fmtTime(event.endAt)}, ${where(event)}.`],
    ['How do I get my ticket?', 'Once your registration is confirmed, a QR ticket is emailed to you and saved under My tickets. Show it at the entrance.'],
    [
      'Can I get a refund?',
      event.refundPolicy === 'full'
        ? 'Yes. You can cancel a paid ticket from My tickets before the event for a full refund.'
        : 'Tickets are non-refundable. If the organizer cancels the event, every paid ticket is refunded automatically.',
    ],
    ['What happens if tickets sell out?', 'You can join the waitlist. When a seat is released, the next person in line is promoted automatically and notified by email.'],
    ['How long is my seat held during payment?', 'Paid seats are held for 15 minutes while you complete checkout. If payment is not completed, the seat is released.'],
  ];
  const [open, setOpen] = useState(0);

  return (
    <section className="py-24">
      <div className="container-x max-w-3xl">
        <Reveal className="text-center">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">Got questions?</h2>
          <p className="mt-3 text-cream/55">We&apos;ve got answers.</p>
        </Reveal>
        <div className="mt-12 space-y-3">
          {items.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.05}>
              <div className={`rounded-2xl border transition ${open === i ? 'border-gold/40 bg-navy' : 'border-cream/10 bg-navy/40'}`}>
                <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={open === i}>
                  <span className="font-sans text-base font-semibold">{q}</span>
                  <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-2xl leading-none text-gold">
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="px-6 pb-5 text-cream/65">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- cta ----------------------------------- */

function ClosingCta({ event }) {
  const start = new Date(event.startAt);
  return (
    <section className="relative overflow-hidden py-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bannerFor(event)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/40" />
      <div className="container-x relative flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
        <Reveal>
          <h2 className="max-w-2xl text-4xl font-black uppercase leading-[0.95] sm:text-6xl">
            Join the event that&apos;ll <span className="gold-text">shape your year</span>
          </h2>
          {event.status === 'published' && (
            <a href="#tickets" className="btn-gold mt-10">
              Get tickets
            </a>
          )}
        </Reveal>
        <Reveal delay={0.2} className="rounded-2xl border border-gold/30 bg-navy-deep/70 px-6 py-4 backdrop-blur">
          <p className="font-display text-2xl font-bold">
            {start.getDate()} {start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm text-cream/60">{where(event)}</p>
        </Reveal>
      </div>
    </section>
  );
}
