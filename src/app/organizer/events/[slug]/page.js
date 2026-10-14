'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import RequireRole from '@/components/RequireRole';
import EventForm from '@/components/EventForm';
import { Alert, Modal, PageLoader, Spinner, StatusBadge } from '@/components/UI';
import Overview from '@/components/organizer/Overview';
import TicketManager from '@/components/organizer/TicketManager';
import Attendees from '@/components/organizer/Attendees';
import CheckIn from '@/components/organizer/CheckIn';
import BannerUpload from '@/components/organizer/BannerUpload';
import { api } from '@/lib/api';
import { bannerFor, dateRange, where } from '@/lib/format';

const TABS = [
  ['overview', 'Overview'],
  ['details', 'Details'],
  ['tickets', 'Tickets'],
  ['attendees', 'Attendees'],
  ['checkin', 'Check-in'],
];

export default function ManageEventPage() {
  return (
    <RequireRole roles={['organizer', 'admin']}>
      <Suspense fallback={<div className="pt-24"><PageLoader /></div>}>
        <Manage />
      </Suspense>
    </RequireRole>
  );
}

function Manage() {
  const { slug } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState(params.get('tab') || 'overview');
  const [error, setError] = useState(
    params.get('bannerError') ? `The event was created, but the banner didn't upload: ${params.get('bannerError')} Try again on the Details tab.` : ''
  );
  const [notice, setNotice] = useState(params.get('created') ? 'Draft created. Add at least one ticket tier, then publish.' : '');
  const [busy, setBusy] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(
    () =>
      api(`/events/${slug}`)
        .then(({ data }) => setEvent(data))
        .catch(setLoadError),
    [slug]
  );

  useEffect(() => {
    load();
  }, [load]);

  const switchTab = (t) => {
    setTab(t);
    router.replace(`/organizer/events/${slug}?tab=${t}`, { scroll: false });
  };

  const action = async (name, fn, message) => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      await fn();
      if (message) setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setConfirmRemove(false);
    setBusy('remove');
    setError('');
    try {
      const { data } = await api(`/events/${event._id}`, { method: 'DELETE' });
      if (data.deleted) {
        router.push('/organizer');
        return;
      }
      setNotice('Event cancelled. Every registration was cancelled and paid tickets refunded.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  if (loadError) {
    return (
      <div className="container-x pb-20 pt-32">
        <Alert>{loadError.status === 404 ? 'This event was not found or you do not have access to it.' : loadError.message}</Alert>
        <Link href="/organizer" className="btn-navy mt-6">
          ← Back to dashboard
        </Link>
      </div>
    );
  }
  if (!event) return <div className="pt-24"><PageLoader label="Loading event…" /></div>;

  const closed = ['cancelled', 'completed'].includes(event.status);

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-32 text-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerFor(event)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy/90 to-navy/60" />
        <div className="container-x relative">
          <Link href="/organizer" className="font-ui text-sm text-cream/60 hover:text-gold">
            ← All events
          </Link>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <StatusBadge status={event.status} />
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{event.title}</h1>
              <p className="mt-2 text-cream/70">
                {dateRange(event.startAt, event.endAt)} · {where(event)}
              </p>
            </motion.div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/events/${event.slug}`} className="btn-outline">
                View page
              </Link>
              {event.status === 'draft' && (
                <button
                  className="btn-gold"
                  disabled={Boolean(busy)}
                  onClick={() => action('publish', () => api(`/events/${event._id}/publish`, { method: 'POST' }), 'Published! Your event is now live.')}
                >
                  {busy === 'publish' && <Spinner className="h-4 w-4" />} Publish
                </button>
              )}
              {event.status === 'published' && (
                <button
                  className="btn-outline"
                  disabled={Boolean(busy)}
                  onClick={() => action('unpublish', () => api(`/events/${event._id}/unpublish`, { method: 'POST' }), 'Moved back to draft.')}
                >
                  {busy === 'unpublish' && <Spinner className="h-4 w-4" />} Unpublish
                </button>
              )}
              {event.status !== 'completed' && event.status !== 'cancelled' && (
                <button className="btn border border-rose-400/60 text-rose-200 hover:bg-rose-600 hover:text-white" disabled={Boolean(busy)} onClick={() => setConfirmRemove(true)}>
                  {busy === 'remove' && <Spinner className="h-4 w-4" />} Cancel / delete
                </button>
              )}
            </div>
          </div>

          <div className="-mx-4 mt-10 flex gap-1 overflow-x-auto px-4">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => switchTab(value)}
                className={`relative shrink-0 rounded-t-2xl px-5 py-3 font-ui text-sm font-semibold transition ${tab === value ? 'text-navy' : 'text-cream/70 hover:text-gold-soft'}`}
              >
                {tab === value && <motion.span layoutId="manage-tab" className="absolute inset-0 rounded-t-2xl bg-cream" />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 pt-10">
        <div className="container-x">
          <div className="mb-6 space-y-3">
            <Alert>{error}</Alert>
            <Alert kind="success">{notice}</Alert>
          </div>

          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {tab === 'overview' && <Overview event={event} />}
            {tab === 'details' && (
              <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="card p-6 sm:p-8">
                  <h2 className="mb-6 text-2xl font-bold text-navy">Event details</h2>
                  {closed ? (
                    <p className="text-charcoal/60">A {event.status} event can no longer be edited.</p>
                  ) : (
                    <EventForm
                      event={event}
                      submitLabel="Save changes"
                      onSubmit={async (body) => {
                        await api(`/events/${event._id}`, { method: 'PATCH', body });
                        await load();
                      }}
                    />
                  )}
                </div>
                <BannerUpload event={event} onUploaded={load} />
              </div>
            )}
            {tab === 'tickets' && <TicketManager event={event} onChange={load} />}
            {tab === 'attendees' && <Attendees event={event} />}
            {tab === 'checkin' && <CheckIn event={event} />}
          </motion.div>
        </div>
      </section>

      <Modal open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Cancel or delete event?">
        <p className="text-charcoal/70">
          If nobody has registered, the event is deleted permanently. Otherwise it is <strong>cancelled</strong>: every registration is cancelled,
          paid tickets are refunded, and guests are emailed. This cannot be undone.
        </p>
        <div className="mt-8 flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => setConfirmRemove(false)}>
            Keep event
          </button>
          <button className="btn flex-1 bg-rose-600 text-white hover:bg-rose-700" onClick={remove}>
            Yes, continue
          </button>
        </div>
      </Modal>
    </>
  );
}
