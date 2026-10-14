'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stagger, rise } from '../Motion';
import { Alert, PageLoader } from '../UI';
import { api } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';

export default function Overview({ event }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/events/${event._id}/stats`)
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message));
  }, [event._id, event.updatedAt]);

  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <PageLoader label="Crunching numbers…" />;

  const r = stats.registrations;
  const attending = r.confirmed + r['checked-in'];
  const revenue = stats.revenue.length ? stats.revenue.map((x) => money(x.amount, x.currency, null)).join(' · ') : money(0, 'NGN', null);

  const cards = [
    ['Attending', `${attending}`, `of ${stats.capacity} capacity`],
    ['Revenue', revenue, 'successful payments'],
    ['Checked in', `${r['checked-in']}`, `${Math.round(stats.checkInRate * 100)}% of attendees`],
    ['Waitlist', `${r.waitlisted}`, `${r.pending} awaiting payment`],
  ];

  return (
    <div className="space-y-8">
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value, sub]) => (
          <motion.div key={label} variants={rise} className="card p-6">
            <p className="font-ui text-xs font-semibold uppercase tracking-widest text-charcoal/50">{label}</p>
            <p className="mt-2 truncate font-display text-3xl font-bold text-navy">{value}</p>
            <p className="mt-1 text-sm text-charcoal/50">{sub}</p>
          </motion.div>
        ))}
      </Stagger>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h3 className="text-xl font-bold text-navy">Ticket sales</h3>
          {stats.ticketTypes.length === 0 ? (
            <p className="mt-4 text-charcoal/60">No ticket tiers yet.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {stats.ticketTypes.map((t) => {
                const pct = Math.round((t.sold / t.quantity) * 100);
                return (
                  <li key={t.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-navy">
                        {t.name} <span className="font-normal text-charcoal/50">· {money(t.price)}</span>
                      </span>
                      <span className="text-charcoal/60">
                        {t.sold} / {t.quantity}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-6 sm:p-8">
          <h3 className="text-xl font-bold text-navy">Registrations by status</h3>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {['confirmed', 'checked-in', 'pending', 'waitlisted', 'cancelled'].map((s) => (
              <li key={s} className="rounded-xl bg-mist px-4 py-3">
                <p className="text-xs capitalize text-charcoal/55">{s.replace('-', ' ')}</p>
                <p className="font-display text-2xl font-bold text-navy">{r[s]}</p>
              </li>
            ))}
            <li className="rounded-xl bg-navy px-4 py-3 text-cream">
              <p className="text-xs text-cream/60">Total</p>
              <p className="font-display text-2xl font-bold text-gold">{r.total}</p>
            </li>
          </ul>
        </div>
      </div>

      {stats.finance?.length > 0 && (
        <div className="card overflow-x-auto p-6 sm:p-8">
          <h3 className="text-xl font-bold text-navy">Earnings</h3>
          <p className="mt-1 text-sm text-charcoal/55">Your share is held until a few days after the event ends, then paid to your payout account.</p>
          <table className="mt-6 w-full min-w-[560px] text-left text-sm">
            <thead className="font-ui text-xs uppercase tracking-wider text-charcoal/50">
              <tr>
                <th className="pb-3">Gross</th>
                <th className="pb-3">Platform fee</th>
                <th className="pb-3">Your net</th>
                <th className="pb-3">Refunded</th>
                <th className="pb-3">Payout</th>
              </tr>
            </thead>
            <tbody>
              {stats.finance.map((f) => (
                <tr key={f.currency} className="border-t border-mist">
                  <td className="py-3 font-semibold text-navy">{money(f.gross, f.currency, null)}</td>
                  <td className="py-3">{money(f.platformFee, f.currency, null)}</td>
                  <td className="py-3 font-semibold text-emerald-700">{money(f.organizerNet, f.currency, null)}</td>
                  <td className="py-3">{money(f.refunded, f.currency, null)}</td>
                  <td className="py-3">
                    {f.payout ? `${f.payout.status} · ${money(f.payout.amount, f.currency, null)}` : `Held until ${fmtDate(f.availableAt)}`}
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
