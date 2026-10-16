'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, PageLoader, StatusBadge } from './UI';
import { api } from '@/lib/api';
import { fmtDateTime, money } from '@/lib/format';

// Rows from the money ledger (GET /transactions/me or GET /admin/transactions).
export const TRANSACTION_TYPES = {
  ticket_payment: 'Ticket payment',
  commission: 'Platform fee',
  refund: 'Refund',
  payout: 'Payout',
};
const STATUSES = ['pending', 'success', 'failed', 'reversed'];
const PAGE_SIZE = 20;

// A short explanation of each row, worded for who is reading it.
function describe(t, audience) {
  if (t.note) return t.note;
  switch (t.type) {
    case 'ticket_payment':
      return t.status === 'pending' ? 'Checkout started, awaiting payment' : 'Paid with Paystack';
    case 'commission':
      return t.status === 'reversed'
        ? 'Fee returned: ticket refunded'
        : audience === 'admin'
          ? 'Platform fee earned on a ticket sale'
          : 'Platform fee taken from a ticket sale';
    case 'refund':
      return 'Returned to the buyer';
    case 'payout':
      return audience === 'admin' ? 'Sent to the organizer' : 'Sent to your bank account';
    default:
      return '';
  }
}

/**
 * @param {string} path            API path to list from
 * @param {'admin'|'organizer'} audience
 * @param {string[]} types          which types can be filtered (all by default)
 * @param {string} title
 * @param {string} emptyText
 */
export default function TransactionsTable({ path, audience, types = Object.keys(TRANSACTION_TYPES), title = 'Transactions', emptyText }) {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const showUser = audience === 'admin';

  useEffect(() => {
    let cancelled = false;
    setError('');
    api(path, { query: { type, status, page, limit: PAGE_SIZE } })
      .then(({ data, meta }) => !cancelled && setResult({ items: data, total: meta.total }))
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setResult({ items: [], total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [path, type, status, page]);

  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-mist p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-navy">{title}</h3>
          <p className="text-sm text-charcoal/60">
            {audience === 'admin'
              ? 'Every money movement on the platform: ticket payments, platform fees, refunds and payouts.'
              : 'Platform fees taken from your ticket sales and the payouts sent to you.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {types.length > 1 && (
            <select className="input sm:!w-48" value={type} onChange={filter(setType)} aria-label="Filter by type">
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_TYPES[t]}
                </option>
              ))}
            </select>
          )}
          <select className="input sm:!w-40" value={status} onChange={filter(setStatus)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s[0].toUpperCase() + s.slice(1)}
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
        <p className="p-10 text-center text-charcoal/60">{type || status ? 'No transactions match these filters.' : emptyText || 'No transactions yet.'}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${showUser ? 'min-w-[980px]' : 'min-w-[760px]'}`}>
              <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  {showUser && <th className="px-6 py-3">Account</th>}
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((t) => (
                  <tr key={t._id} className="border-t border-mist align-top">
                    <td className="whitespace-nowrap px-6 py-4 text-charcoal/60">{fmtDateTime(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-navy">{TRANSACTION_TYPES[t.type] || t.type}</span>
                      <span className="block text-xs text-charcoal/55">{describe(t, audience)}</span>
                    </td>
                    {showUser && (
                      <td className="px-6 py-4">
                        <span className="text-navy">{t.user?.name || '–'}</span>
                        <span className="block text-xs capitalize text-charcoal/55">
                          {t.user?.role}
                          {t.user?.email ? ` · ${t.user.email}` : ''}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {t.event?.slug ? (
                        <Link href={`/organizer/events/${t.event.slug}`} className="text-navy hover:text-gold">
                          {t.event.title}
                        </Link>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right font-semibold ${
                        t.status === 'reversed' || t.status === 'failed'
                          ? 'text-charcoal/40 line-through'
                          : t.type === 'refund'
                            ? 'text-rose-600'
                            : t.type === 'payout' || (t.type === 'commission' && audience === 'admin')
                              ? 'text-emerald-700'
                              : 'text-navy'
                      }`}
                    >
                      {t.type === 'refund' ? '−' : ''}
                      {money(t.amount, t.currency, null)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="max-w-[12rem] px-6 py-4">
                      <span className="block truncate font-mono text-xs text-charcoal/50" title={t.reference}>
                        {t.reference}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-mist px-6 py-4 text-sm">
            <span className="text-charcoal/60">
              {result.total} {result.total === 1 ? 'transaction' : 'transactions'}
              {pages > 1 ? ` · page ${page} of ${pages}` : ''}
            </span>
            {pages > 1 && (
              <div className="flex gap-2">
                <button className="btn-outline !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button className="btn-outline !px-4 !py-2" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
