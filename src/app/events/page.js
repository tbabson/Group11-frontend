'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import EventCard from '@/components/EventCard';
import { Stagger } from '@/components/Motion';
import { EmptyState, PageHeader } from '@/components/UI';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/site';

const LIMIT = 9;

export default function EventsPage() {
  return (
    <>
      <PageHeader eyebrow="Discover" title="All events" subtitle="Search by name, filter by occasion, city, date and price." />
      <Suspense fallback={null}>
        <EventsBrowser />
      </Suspense>
    </>
  );
}

function EventsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = Object.fromEntries(params.entries());
  const page = Number(filters.page || 1);

  const [form, setForm] = useState(filters);
  const [result, setResult] = useState({ items: null, total: 0 });
  const [error, setError] = useState('');

  const key = params.toString();
  useEffect(() => {
    setForm(Object.fromEntries(new URLSearchParams(key).entries()));
    setResult((r) => ({ ...r, items: null }));
    setError('');
    const query = Object.fromEntries(new URLSearchParams(key).entries());
    if (query.from) query.from = new Date(query.from).toISOString();
    if (query.to) query.to = new Date(`${query.to}T23:59:59`).toISOString();
    api('/events', { query: { limit: LIMIT, ...query }, auth: false })
      .then(({ data, meta }) => setResult({ items: data, total: meta?.total || 0 }))
      .catch((err) => {
        setError(err.message);
        setResult({ items: [], total: 0 });
      });
  }, [key]);

  const apply = (next) => {
    const merged = { ...next };
    Object.keys(merged).forEach((k) => (merged[k] === '' || merged[k] === undefined) && delete merged[k]);
    const qs = new URLSearchParams(merged).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    apply({ ...form, page: '' });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pages = Math.max(1, Math.ceil(result.total / LIMIT));
  const activeCount = ['q', 'category', 'city', 'from', 'to', 'isFree', 'when'].filter((k) => filters[k]).length;

  return (
    <section className="py-12">
      <div className="container-x">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card -mt-20 relative z-10 grid gap-4 p-5 shadow-xl shadow-navy/10 sm:grid-cols-2 lg:grid-cols-6 lg:p-6"
        >
          <input className="input lg:col-span-2" placeholder="Search events…" value={form.q || ''} onChange={set('q')} aria-label="Search" />
          <select className="input" value={form.category || ''} onChange={set('category')} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <input className="input" placeholder="City" value={form.city || ''} onChange={set('city')} aria-label="City" />
          <select className="input" value={form.isFree || ''} onChange={set('isFree')} aria-label="Price">
            <option value="">Any price</option>
            <option value="true">Free only</option>
            <option value="false">Paid only</option>
          </select>
          <select className="input" value={form.sort || ''} onChange={set('sort')} aria-label="Sort">
            <option value="">Soonest first</option>
            <option value="-createdAt">Newest added</option>
            <option value="title">Title A–Z</option>
          </select>
          <select
            className="input"
            value={form.when || ''}
            onChange={set('when')}
            aria-label="When"
            disabled={Boolean(form.from || form.to)}
            title={form.from || form.to ? 'Clear the dates to choose this' : undefined}
          >
            <option value="">Upcoming</option>
            <option value="live">Happening now</option>
            <option value="current">Live &amp; upcoming</option>
          </select>
          <label className="flex items-center gap-2 lg:col-span-2">
            <span className="w-12 shrink-0 text-sm text-charcoal/60">From</span>
            <input type="date" className="input" value={form.from || ''} onChange={set('from')} />
          </label>
          <label className="flex items-center gap-2 lg:col-span-2">
            <span className="w-12 shrink-0 text-sm text-charcoal/60">To</span>
            <input type="date" className="input" value={form.to || ''} onChange={set('to')} />
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <button className="btn-gold flex-1">Apply filters</button>
            {activeCount > 0 && (
              <button type="button" onClick={() => apply({})} className="btn-ghost">
                Clear
              </button>
            )}
          </div>
        </motion.form>

        <div className="mb-6 mt-10 flex items-center justify-between">
          <p className="font-ui text-sm text-charcoal/60">
            {result.items
              ? `${result.total} ${filters.when === 'live' ? 'live ' : ''}event${result.total === 1 ? '' : 's'} found`
              : 'Searching…'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!result.items ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-mist" />
              ))}
            </motion.div>
          ) : result.items.length ? (
            <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((e) => (
                  <EventCard key={e._id} event={e} />
                ))}
              </Stagger>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                title={error ? 'Could not load events' : filters.when === 'live' ? 'Nothing is live right now' : 'No events match your filters'}
                text={
                  error ||
                  (filters.when === 'live'
                    ? 'No event is in progress at the moment. Check the upcoming events instead.'
                    : 'Try a different search, widen the dates, or clear the filters.')
                }
                action={
                  activeCount > 0 && (
                    <button onClick={() => apply({})} className="btn-navy">
                      Clear filters
                    </button>
                  )
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {pages > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => apply({ ...filters, page: page - 1 })}>
              ← Prev
            </button>
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => apply({ ...filters, page: i + 1 })}
                className={`h-10 w-10 rounded-full font-ui text-sm font-semibold transition ${
                  page === i + 1 ? 'bg-navy text-gold' : 'text-charcoal hover:bg-mist'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn-ghost" disabled={page >= pages} onClick={() => apply({ ...filters, page: page + 1 })}>
              Next →
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
