'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RequireRole from '@/components/RequireRole';
import { Stagger, rise } from '@/components/Motion';
import { Alert, EmptyState, PageHeader, PageLoader, Spinner, StatusBadge } from '@/components/UI';
import { useAuth } from '@/lib/auth';
import { bannerFor, fmtDate, fmtTime, money, where } from '@/lib/format';
import { EVENT_BUCKETS, displayStatus, fetchMyEvents } from '@/lib/myEvents';

const PAGE_SIZE = 20;
const SUMMARY_KEY = { live: 'live', draft: 'draft', completed: 'completed', cancelled: 'cancelled' };

export default function OrganizerPage() {
  return (
    <RequireRole roles={['organizer', 'admin']}>
      <Dashboard />
    </RequireRole>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [bucket, setBucket] = useState(undefined);
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Debounce the title search.
  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // A new filter or search starts again from page 1.
  useEffect(() => {
    setPage(1);
    setItems(null);
  }, [bucket, q]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    if (page > 1) setLoadingMore(true);
    fetchMyEvents({ status: bucket, q, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setItems((prev) => (page === 1 || !prev ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setSummary(res.summary);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setItems((prev) => prev || []);
      })
      .finally(() => !cancelled && setLoadingMore(false));
    return () => {
      cancelled = true;
    };
  }, [bucket, q, page]);

  const countFor = (b) => (summary ? (b ? summary[SUMMARY_KEY[b]] : summary.total) : '–');
  const activeLabel = EVENT_BUCKETS.find(([b]) => b === bucket)?.[1];

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Events dashboard' : 'Organizer studio'}
        title={isAdmin ? 'All platform events' : `Hello, ${user.name.split(' ')[0]}`}
        subtitle={isAdmin ? 'Every event across all organizers.' : 'Create events, release tickets, and run the door.'}
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/organizer/payouts" className="btn-outline">
            Payouts
          </Link>
          <Link href="/organizer/events/new" className="btn-gold">
            + Create event
          </Link>
        </div>
      </PageHeader>

      <section className="py-12">
        <div className="container-x">
          <Stagger className="-mt-20 relative z-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {EVENT_BUCKETS.map(([b, label]) => {
              const active = bucket === b;
              return (
                <motion.button
                  key={label}
                  variants={rise}
                  type="button"
                  onClick={() => setBucket(b)}
                  aria-pressed={active}
                  className={`card p-6 text-left shadow-lg shadow-navy/5 transition hover:-translate-y-0.5 ${
                    active ? 'ring-2 ring-gold' : 'hover:ring-1 hover:ring-gold/40'
                  }`}
                >
                  <p className="font-ui text-xs font-semibold uppercase tracking-widest text-charcoal/50">{label}</p>
                  <p className="mt-2 font-display text-4xl font-bold text-navy">{countFor(b)}</p>
                </motion.button>
              );
            })}
          </Stagger>

          <div className="mb-6 mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-navy">{bucket ? activeLabel : isAdmin ? 'All events' : 'Your events'}</h2>
              {items && <p className="mt-1 text-sm text-charcoal/55">{total === 1 ? '1 event' : `${total} events`}</p>}
            </div>
            <input
              className="input sm:!w-72"
              placeholder="Search by title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search events by title"
            />
          </div>
          <Alert>{error}</Alert>

          {!items ? (
            <PageLoader label="Loading events…" />
          ) : items.length === 0 ? (
            <EmptyState
              title={bucket || q ? 'No events match' : 'No events yet'}
              text={bucket || q ? 'Try another filter or search.' : 'Create your first event, add ticket tiers, and publish when you’re ready.'}
              action={
                bucket || q ? (
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setBucket(undefined);
                      setQuery('');
                    }}
                  >
                    Show all events
                  </button>
                ) : (
                  <Link href="/organizer/events/new" className="btn-gold">
                    Create event
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {items.map((e) => (
                  <EventRow key={e._id} event={e} showOrganizer={isAdmin} />
                ))}
              </div>
              {items.length < total && (
                <div className="mt-8 text-center">
                  <button className="btn-outline" onClick={() => setPage((p) => p + 1)} disabled={loadingMore}>
                    {loadingMore && <Spinner className="h-4 w-4" />} Load more ({total - items.length} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function EventRow({ event: e, showOrganizer }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={`/organizer/events/${e.slug}`}
        className="card group flex flex-col overflow-hidden transition hover:shadow-xl hover:shadow-navy/10 sm:flex-row"
      >
        <div className="relative h-40 shrink-0 sm:h-auto sm:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerFor(e)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <StatusBadge status={displayStatus(e)} />
              <span className="font-ui text-xs uppercase tracking-wider text-charcoal/50">{e.category}</span>
            </div>
            <h3 className="mt-2 truncate font-display text-2xl font-bold text-navy group-hover:text-gold">{e.title}</h3>
            <p className="mt-1 text-sm text-charcoal/60">
              {fmtDate(e.startAt, { weekday: 'short' })} · {fmtTime(e.startAt)} · {where(e)}
            </p>
            {showOrganizer && e.organizer?.name && <p className="mt-1 text-xs text-charcoal/50">by {e.organizer.name}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-6 text-sm">
            <div>
              <p className="text-charcoal/50">Sold</p>
              <p className="font-semibold text-navy">
                {e.ticketsSold}
                <span className="font-normal text-charcoal/50"> / {e.ticketsTotal || e.capacity}</span>
              </p>
            </div>
            <div>
              <p className="text-charcoal/50">From</p>
              <p className="font-semibold text-navy">{e.ticketTypes ? money(e.minPrice) : '–'}</p>
            </div>
            <span className="font-ui font-semibold text-gold transition group-hover:translate-x-1">Manage →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
