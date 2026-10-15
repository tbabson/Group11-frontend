'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RequireRole from '@/components/RequireRole';
import TicketQR from '@/components/TicketQR';
import { Alert, EmptyState, Modal, PageHeader, PageLoader, Spinner, StatusBadge } from '@/components/UI';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bannerFor, fmtDate, fmtTime, money, where } from '@/lib/format';

const TABS = [
  ['', 'All'],
  ['confirmed', 'Confirmed'],
  ['pending', 'Awaiting payment'],
  ['waitlisted', 'Waitlisted'],
  ['checked-in', 'Attended'],
  ['cancelled', 'Cancelled'],
];

export default function DashboardPage() {
  return (
    <RequireRole roles={['attendee']}>
      <Tickets />
    </RequireRole>
  );
}

function Tickets() {
  const { user } = useAuth();
  const [tab, setTab] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [qr, setQr] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setItems(null);
    api('/me/registrations', { query: { status: tab, limit: 50 } })
      .then(({ data }) => setItems(data))
      .catch((err) => {
        setError(err.message);
        setItems([]);
      });
  }, [tab]);

  useEffect(load, [load]);

  const pay = async (reg) => {
    setBusy(reg._id);
    setError('');
    try {
      const { data } = await api('/payments/initialize', { method: 'POST', body: { registrationId: reg._id } });
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  const confirmCancel = async () => {
    const reg = cancelling;
    setBusy(reg._id);
    setError('');
    try {
      await api(`/registrations/${reg._id}`, { method: 'DELETE' });
      setNotice(`Your ticket for ${reg.event?.title} was cancelled.`);
      setCancelling(null);
      load();
    } catch (err) {
      setError(err.message);
      setCancelling(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow={`Welcome, ${user.name.split(' ')[0]}`} title="My tickets" subtitle="Your reservations, QR codes and payment status in one place.">
        <Link href="/events" className="btn-gold">
          Find more events
        </Link>
      </PageHeader>

      <section className="py-12">
        <div className="container-x">
          <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`relative shrink-0 rounded-full px-5 py-2.5 font-ui text-sm font-semibold transition ${tab === value ? 'text-navy' : 'text-charcoal/60 hover:text-navy'}`}
              >
                {tab === value && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-gold/20 ring-1 ring-gold" />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 space-y-3">
            <Alert>{error}</Alert>
            <Alert kind="success">{notice}</Alert>
          </div>

          {!items ? (
            <PageLoader label="Loading your tickets…" />
          ) : items.length === 0 ? (
            <EmptyState
              title="No tickets here yet"
              text="When you reserve a seat it will appear here with your QR code."
              action={
                <Link href="/events" className="btn-gold">
                  Browse events
                </Link>
              }
            />
          ) : (
            <motion.div layout className="grid gap-6 lg:grid-cols-2">
              <AnimatePresence>
                {items.map((reg, i) => (
                  <TicketRow
                    key={reg._id}
                    reg={reg}
                    index={i}
                    busy={busy === reg._id}
                    onQr={() => setQr(reg)}
                    onPay={() => pay(reg)}
                    onCancel={() => setCancelling(reg)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      <Modal open={Boolean(qr)} onClose={() => setQr(null)} title="Your ticket">
        {qr && (
          <div className="text-center">
            <p className="font-display text-xl font-bold text-navy">{qr.event?.title}</p>
            <p className="mb-6 mt-1 text-sm text-charcoal/60">
              {qr.ticketType?.name} · {fmtDate(qr.event?.startAt)} · {fmtTime(qr.event?.startAt)}
            </p>
            <TicketQR
              token={qr.qrToken}
              size={220}
              ticket={{ event: qr.event, ticketType: qr.ticketType, holder: user.name, status: qr.status }}
              filename={`ticket-${qr.event?.slug || qr._id}.png`}
            />
            <p className="mt-5 text-xs text-charcoal/50">Present this code at the entrance. It can be scanned once.</p>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(cancelling)} onClose={() => setCancelling(null)} title="Cancel this ticket?">
        <p className="text-charcoal/70">
          {cancelling?.status === 'pending' ? (
            <>
              This cancels the unpaid order for <strong>{cancelling?.event?.title}</strong>, including any other tickets bought with it, and
              releases those seats.
            </>
          ) : (
            <>
              You&apos;ll lose this seat for <strong>{cancelling?.event?.title}</strong>
              {cancelling?.ticketType?.price
                ? '. Your other tickets stay valid. A paid ticket is refunded (just its price) only if the event offers full refunds.'
                : '. Your other tickets stay valid.'}
            </>
          )}
        </p>
        <div className="mt-8 flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => setCancelling(null)}>
            Keep ticket
          </button>
          <button className="btn flex-1 bg-rose-600 text-white hover:bg-rose-700" onClick={confirmCancel} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Cancel ticket
          </button>
        </div>
      </Modal>
    </>
  );
}

function TicketRow({ reg, index, busy, onQr, onPay, onCancel }) {
  const event = reg.event || {};
  const started = event.startAt && new Date(event.startAt) <= new Date();
  const canCancel = ['pending', 'confirmed', 'waitlisted'].includes(reg.status) && !started;
  const hasQr = ['confirmed', 'checked-in'].includes(reg.status) && reg.qrToken;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="card flex overflow-hidden"
    >
      <div className="relative hidden w-40 shrink-0 sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerFor(event)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/40" />
      </div>
      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/events/${event.slug}`} className="line-clamp-1 font-display text-xl font-bold text-navy hover:text-gold">
              {event.title || 'Event'}
            </Link>
            <p className="mt-1 text-sm text-charcoal/60">
              {event.startAt && `${fmtDate(event.startAt, { weekday: 'short' })} · ${fmtTime(event.startAt)}`}
            </p>
            <p className="text-sm text-charcoal/60">{where(event)}</p>
          </div>
          <StatusBadge status={reg.status} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="rounded-lg bg-mist px-2.5 py-1 font-ui text-xs font-semibold text-navy">{reg.ticketType?.name}</span>
          <span className="text-charcoal/60">{money(reg.ticketType?.price, reg.ticketType?.currency)}</span>
        </div>
        {reg.status === 'pending' && reg.holdExpiresAt && (
          <p className="mt-3 text-xs text-amber-700">Seat held until {fmtTime(reg.holdExpiresAt)}. Complete payment to confirm.</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {hasQr && (
            <button onClick={onQr} className="btn-navy !px-4 !py-2">
              Show QR ticket
            </button>
          )}
          {reg.status === 'pending' && (
            <button onClick={onPay} disabled={busy} className="btn-gold !px-4 !py-2">
              {busy && <Spinner className="h-4 w-4" />} Complete payment
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel} disabled={busy} className="btn-ghost !px-4 !py-2 text-rose-600">
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
