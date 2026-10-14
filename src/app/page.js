'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import EventCard from '@/components/EventCard';
import { Reveal, SectionHeading, Stagger, rise } from '@/components/Motion';
import { EmptyState } from '@/components/UI';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/site';

const HEADLINE = ['Where', 'Unforgettable', 'Moments', 'Begin'];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <UpcomingEvents />
      <Categories />
      <HowItWorks />
      <HostSection />
      <FinalCta />
    </>
  );
}

function Hero() {
  const router = useRouter();
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const submit = (e) => {
    e.preventDefault();
    router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
  };

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-navy-deep">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero.jpg)', y: bgY, scale: bgScale }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/80 via-navy/70 to-navy-deep" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(7_20_42/0.8)_80%)]" />

      <motion.div style={{ y: contentY, opacity: fade }} className="container-x relative z-10 py-32 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1.2 }}
          className="eyebrow mb-6"
        >
          Galas · Conferences · Weddings · VIP Nights
        </motion.p>

        <h1 className="mx-auto max-w-5xl text-[2.3rem] font-black uppercase leading-[0.95] tracking-tight text-cream min-[420px]:text-5xl sm:text-7xl lg:text-8xl">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={word}
              className={`mr-[0.25em] inline-block ${i === 2 ? 'gold-text' : ''}`}
              initial={{ opacity: 0, y: 60, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-cream/75 sm:text-xl"
        >
          Discover premium experiences, secure your seat in seconds, and walk in with a QR ticket. Hosting? Sell
          tickets and check guests in from one elegant dashboard.
        </motion.p>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-gold/30 bg-cream/10 p-2 shadow-2xl shadow-navy-deep/50 backdrop-blur-md"
        >
          <svg viewBox="0 0 24 24" className="ml-3 h-5 w-5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search galas, conferences, concerts…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-cream outline-none placeholder:text-cream/50"
            aria-label="Search events"
          />
          <button className="btn-gold shrink-0 !px-5 sm:!px-7">Search</button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/events" className="btn-gold">
            Explore events
          </Link>
          <Link href="/register?role=organizer" className="btn-outline">
            Host an event
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-hidden="true"
      >
        <div className="flex h-11 w-7 justify-center rounded-full border-2 border-gold/50 pt-2">
          <span className="h-2 w-1 rounded-full bg-gold" />
        </div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ['Black-Tie Galas', 'Tech Conferences', 'Luxury Weddings', 'Award Nights', 'VIP Parties', 'Live Concerts', 'Masterclasses', 'Private Dinners'];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-gold/20 bg-navy py-5">
      <motion.div
        className="flex w-max gap-10"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-xl font-semibold italic text-cream/80 sm:text-2xl">
            {item}
            <span className="text-gold">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function UpcomingEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/events', { query: { limit: 6, sort: 'startAt' }, auth: false })
      .then(({ data }) => setEvents(data))
      .catch((err) => {
        setError(err.message);
        setEvents([]);
      });
  }, []);

  return (
    <section className="py-24">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="Upcoming"
            title="Experiences worth dressing up for"
            subtitle="Hand-picked events happening soon. Reserve early: the best seats go first."
          />
          <Reveal delay={0.2}>
            <Link href="/events" className="btn-navy">
              View all events →
            </Link>
          </Reveal>
        </div>

        <div className="mt-14">
          {!events ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-mist" />
              ))}
            </div>
          ) : events.length ? (
            <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e._id} event={e} />
              ))}
            </Stagger>
          ) : (
            <EmptyState
              title={error ? 'Events are unavailable right now' : 'No upcoming events yet'}
              text={error || 'Check back soon, or be the first to host something remarkable.'}
              action={
                <Link href="/register?role=organizer" className="btn-gold">
                  Host an event
                </Link>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section id="categories" className="navy-texture scroll-mt-20 py-24">
      <div className="container-x">
        <SectionHeading dark eyebrow="Browse by occasion" title="Every celebration, curated" subtitle="From boardroom summits to candle-lit receptions, find the room you belong in." />
        <Stagger className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {CATEGORIES.map((c, i) => (
            <motion.div key={c.slug} variants={rise} className={i === 0 ? 'md:row-span-2' : ''}>
              <Link
                href={`/events?category=${c.slug}`}
                className="group relative block h-full min-h-48 overflow-hidden rounded-3xl ring-1 ring-gold/10 md:min-h-56"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy/40 to-transparent transition group-hover:via-navy/20" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-6">
                  <h3 className="text-xl font-bold text-cream sm:text-2xl">{c.label}</h3>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy opacity-0 transition duration-300 group-hover:opacity-100">
                    →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', title: 'Discover', text: 'Browse curated events by city, date, category or price, and find the one that fits your evening.' },
  { n: '02', title: 'Reserve', text: 'Pick Regular or VIP. Free tickets confirm instantly; paid seats are held for 15 minutes while you pay securely with Paystack.' },
  { n: '03', title: 'Arrive', text: 'Your QR ticket lands in your inbox and dashboard. Show it at the door and you are in. No paper, no queues.' },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-24">
      <div className="container-x">
        <SectionHeading eyebrow="How it works" title="From invitation to entrance in three steps" />
        <Stagger className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block" />
          {STEPS.map((s) => (
            <motion.div key={s.n} variants={rise} className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-cream font-display text-2xl font-bold text-gold shadow-lg shadow-gold/10">
                {s.n}
              </div>
              <h3 className="mt-6 text-2xl font-bold text-navy">{s.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-charcoal/70">{s.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const HOST_FEATURES = [
  ['Free, Regular & VIP tickets', 'Set quantities, prices and sale windows for each tier.'],
  ['Waitlists that fill themselves', 'When a seat frees up, the next guest is promoted automatically.'],
  ['QR check-in at the door', 'Scan or paste a ticket code; duplicates are rejected instantly.'],
  ['Reports & payouts', 'Live sales stats, CSV guest lists, and earnings paid to your bank.'],
];

function HostSection() {
  return (
    <section className="bg-mist py-24">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-navy/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hall.jpg" alt="An elegant conference hall prepared for guests" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
          </div>
          <motion.div
            className="absolute -bottom-6 -right-2 rounded-2xl bg-navy p-5 text-cream shadow-xl sm:-right-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <p className="font-ui text-xs uppercase tracking-widest text-gold">Check-in</p>
            <p className="mt-1 font-display text-3xl font-bold">QR-ready</p>
            <p className="text-sm text-cream/60">Every ticket, verified once</p>
          </motion.div>
        </Reveal>

        <div>
          <SectionHeading
            align="left"
            eyebrow="For organizers"
            title="Host with the polish your guests expect"
            subtitle="Create the event, set your tiers, publish, and let the platform handle payments, reminders and the door."
          />
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2">
            {HOST_FEATURES.map(([title, text]) => (
              <motion.div key={title} variants={rise} className="card p-5">
                <div className="mb-3 h-1 w-10 rounded-full bg-gold" />
                <h4 className="text-lg font-bold text-navy">{title}</h4>
                <p className="mt-1.5 text-sm text-charcoal/65">{text}</p>
              </motion.div>
            ))}
          </Stagger>
          <Reveal delay={0.3} className="mt-10">
            <Link href="/register?role=organizer" className="btn-gold">
              Start hosting
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/gala.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-navy/85" />
      <Reveal className="container-x relative text-center">
        <p className="eyebrow mb-4">Your next evening awaits</p>
        <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase leading-tight text-cream sm:text-6xl">
          Be on the <span className="gold-text">guest list</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-cream/70">Create a free account to reserve seats, keep your tickets in one place, and get reminders before the doors open.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/register" className="btn-gold">
            Create free account
          </Link>
          <Link href="/events" className="btn-outline">
            Browse events
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
