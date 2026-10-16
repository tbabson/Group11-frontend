'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RequireRole from '@/components/RequireRole';
import TransactionsTable from '@/components/TransactionsTable';
import { Stagger, rise } from '@/components/Motion';
import { Alert, PageHeader, PageLoader, Spinner, StatusBadge } from '@/components/UI';
import { api } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';

const TABS = [
  ['revenue', 'Revenue'],
  ['transactions', 'Transactions'],
  ['users', 'Users'],
  ['payouts', 'Payouts'],
];

export default function AdminPage() {
  return (
    <RequireRole roles={['admin']}>
      <Admin />
    </RequireRole>
  );
}

function Admin() {
  const [tab, setTab] = useState('revenue');
  return (
    <>
      <PageHeader eyebrow="Administration" title="Platform console" subtitle="Platform earnings, accounts and organizer payouts.">
        <Link href="/organizer" className="btn-outline">
          Events dashboard
        </Link>
      </PageHeader>
      <section className="py-12">
        <div className="container-x">
          <div className="mb-8 flex gap-2">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`relative rounded-full px-5 py-2.5 font-ui text-sm font-semibold ${tab === value ? 'text-navy' : 'text-charcoal/60 hover:text-navy'}`}
              >
                {tab === value && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-gold/20 ring-1 ring-gold" />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          {tab === 'revenue' && <Revenue />}
          {tab === 'transactions' && (
            <TransactionsTable
              path="/admin/transactions"
              audience="admin"
              title="Transactions"
              emptyText="No money has moved yet. Ticket payments, fees, refunds and payouts appear here."
            />
          )}
          {tab === 'users' && <Users />}
          {tab === 'payouts' && <PayoutsTable />}
        </div>
      </section>
    </>
  );
}

function Revenue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/admin/revenue').then(({ data: d }) => setData(d)).catch((err) => setError(err.message));
  }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;
  const rows = data.revenue.length ? data.revenue : [{ currency: 'NGN', gross: 0, platformFees: 0, organizerNet: 0, payments: 0 }];
  return (
    <div className="space-y-6">
      <p className="text-sm text-charcoal/60">
        Fee: {data.feePercent}%{data.feeFlat ? ` + ${money(data.feeFlat, 'NGN', null)}` : ''} per paid ticket.
      </p>
      {rows.map((r) => (
        <Stagger key={r.currency} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Gross sales', money(r.gross, r.currency, null)],
            ['Platform fees', money(r.platformFees, r.currency, null)],
            ['Organizer share', money(r.organizerNet, r.currency, null)],
            ['Payments', r.payments],
          ].map(([label, value]) => (
            <motion.div key={label} variants={rise} className="card p-6">
              <p className="font-ui text-xs font-semibold uppercase tracking-widest text-charcoal/50">{label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-navy">{value}</p>
            </motion.div>
          ))}
        </Stagger>
      ))}
      <RevenueByEvent />
    </div>
  );
}

const REVENUE_SORTS = [
  ['gross', 'Gross sales'],
  ['platformFees', 'Platform fees'],
  ['payments', 'Payments'],
  ['refunded', 'Refunds'],
  ['startAt', 'Event date'],
];
const REVENUE_PAGE = 20;

// Per-event breakdown from GET /admin/revenue/events.
function RevenueByEvent() {
  const [sort, setSort] = useState('gross');
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    api('/admin/revenue/events', { query: { sort, q, page, limit: REVENUE_PAGE } })
      .then(({ data, meta }) => !cancelled && setResult({ items: data, total: meta.total }))
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setResult({ items: [], total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [sort, q, page]);

  const pages = result ? Math.max(1, Math.ceil(result.total / REVENUE_PAGE)) : 1;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-mist p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-navy">Revenue by event</h3>
          <p className="text-sm text-charcoal/60">Paid tickets only. Free events have no revenue and aren&apos;t listed.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input sm:!w-64"
            placeholder="Search event title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search events"
          />
          <select
            className="input sm:!w-48"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort by"
          >
            {REVENUE_SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                Sort: {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {!result ? (
        <PageLoader />
      ) : result.items.length === 0 ? (
        <p className="p-10 text-center text-charcoal/60">{q ? 'No events match that search.' : 'No ticket sales yet.'}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
                <tr>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Organizer</th>
                  <th className="px-6 py-3 text-right">Payments</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Platform fee</th>
                  <th className="px-6 py-3 text-right">Organizer share</th>
                  <th className="px-6 py-3 text-right">Refunded</th>
                  <th className="px-6 py-3">Payout</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((r) => (
                  <tr key={`${r.event._id}-${r.currency}`} className="border-t border-mist align-top">
                    <td className="px-6 py-4">
                      <Link href={`/organizer/events/${r.event.slug}`} className="font-semibold text-navy hover:text-gold">
                        {r.event.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-charcoal/55">
                        <StatusBadge status={r.event.status} />
                        <span>{fmtDate(r.event.startAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-charcoal/70">{r.organizer?.name || '–'}</td>
                    <td className="px-6 py-4 text-right">
                      {r.payments}
                      {r.refunds > 0 && <span className="block text-xs text-charcoal/50">{r.refunds} refunded</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-navy">{money(r.gross, r.currency, null)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-700">{money(r.platformFees, r.currency, null)}</td>
                    <td className="px-6 py-4 text-right">{money(r.organizerNet, r.currency, null)}</td>
                    <td className="px-6 py-4 text-right text-rose-600">{r.refunded ? money(r.refunded, r.currency, null) : '–'}</td>
                    <td className="px-6 py-4">
                      {r.payout ? (
                        <StatusBadge status={r.payout.status} />
                      ) : (
                        <span className="text-xs text-charcoal/55">
                          Held until
                          <br />
                          {fmtDate(r.availableAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-mist px-6 py-4 text-sm">
              <span className="text-charcoal/60">
                Page {page} of {pages} · {result.total} events
              </span>
              <div className="flex gap-2">
                <button className="btn-outline !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button className="btn-outline !px-4 !py-2" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Users() {
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setItems(null);
    api('/admin/users', { query: { role, q, limit: 50 } })
      .then(({ data }) => setItems(data))
      .catch((err) => {
        setError(err.message);
        setItems([]);
      });
  }, [role, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-mist p-6 sm:flex-row">
        <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:!w-48" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="attendee">Attendees</option>
          <option value="organizer">Organizers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {error && (
        <div className="p-6">
          <Alert>{error}</Alert>
        </div>
      )}
      {!items ? (
        <PageLoader />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-t border-mist">
                  <td className="px-6 py-4 font-semibold text-navy">{u.name}</td>
                  <td className="px-6 py-4 text-charcoal/65">{u.email}</td>
                  <td className="px-6 py-4 capitalize">{u.role}</td>
                  <td className="px-6 py-4 text-charcoal/60">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="p-10 text-center text-charcoal/60">No users found.</p>}
        </div>
      )}
    </div>
  );
}

function PayoutsTable() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api('/admin/payouts', { query: { limit: 50 } })
      .then(({ data }) => setItems(data))
      .catch((err) => {
        setError(err.message);
        setItems([]);
      });
  }, []);
  useEffect(load, [load]);

  const retry = async (id) => {
    setBusy(id);
    setError('');
    try {
      await api(`/admin/payouts/${id}/retry`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (!items) return <PageLoader />;
  return (
    <div className="card overflow-hidden">
      {error && (
        <div className="p-6">
          <Alert>{error}</Alert>
        </div>
      )}
      {items.length === 0 ? (
        <p className="p-10 text-center text-charcoal/60">No payouts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Attempts</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-t border-mist">
                  <td className="px-6 py-4 font-semibold text-navy">{p.event?.title || '–'}</td>
                  <td className="px-6 py-4">{money(p.amount, p.currency, null)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                    {p.failureReason && <p className="mt-1 text-xs text-rose-600">{p.failureReason}</p>}
                  </td>
                  <td className="px-6 py-4">{p.attempts}</td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'failed' && (
                      <button className="btn-gold !px-4 !py-2" onClick={() => retry(p._id)} disabled={busy === p._id}>
                        {busy === p._id && <Spinner className="h-4 w-4" />} Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
