'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/UI';
import { api, loadSession } from '@/lib/api';

export default function PaymentCallbackPage() {
  return (
    <section className="navy-texture flex min-h-screen items-center justify-center px-4 pb-16 pt-28 text-cream">
      <Suspense fallback={<Spinner className="h-8 w-8 text-gold" />}>
        <Result />
      </Suspense>
    </section>
  );
}

// Paystack (or the demo checkout) sends the buyer here. The webhook confirms the ticket,
// so poll the newest registration for a few seconds until it leaves "pending".
function Result() {
  const reference = useSearchParams().get('reference');
  const router = useRouter();
  const [state, setState] = useState('checking');
  const [reg, setReg] = useState(null);
  const slug = reg?.event?.slug;

  // Once the ticket is confirmed, show the success state briefly, then go to the event page,
  // which opens the ticket (QR code) for the buyer.
  useEffect(() => {
    if (state !== 'confirmed' || !slug) return;
    const t = setTimeout(() => router.replace(`/events/${slug}?paid=1`), 2000);
    return () => clearTimeout(t);
  }, [state, slug, router]);

  useEffect(() => {
    if (!loadSession()) return setState('unknown');
    let tries = 0;
    let timer;
    const check = async () => {
      tries += 1;
      try {
        const { data } = await api('/me/registrations', { query: { limit: 1 } });
        const latest = data[0];
        setReg(latest || null);
        if (latest && latest.status !== 'pending') return setState(latest.status === 'confirmed' ? 'confirmed' : latest.status);
      } catch {
        // Keep polling; the dashboard is the fallback.
      }
      if (tries < 8) timer = setTimeout(check, 1500);
      else setState('pending');
    };
    check();
    return () => clearTimeout(timer);
  }, []);

  const copy = {
    checking: ['Confirming your payment', 'This usually takes a few seconds…'],
    confirmed: ['Payment successful', 'Your ticket is confirmed. Taking you back to the event…'],
    cancelled: ['Payment not completed', 'The payment was declined or cancelled, so the seat was released. You can try again from the event page.'],
    pending: ['Still processing', "We haven't received confirmation yet. Check My tickets in a minute."],
    unknown: ['Payment received', 'Sign in to see your ticket.'],
  }[state] || ['Payment update', `Your registration is now ${state}.`];

  const ok = state === 'confirmed';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-[2rem] border border-gold/20 bg-navy/80 p-10 text-center backdrop-blur">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold">
        {state === 'checking' ? (
          <Spinner className="h-9 w-9" />
        ) : (
          <motion.svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5">
            <motion.path
              d={ok ? 'M5 13l4 4L19 7' : 'M12 8v5m0 3.5v.5'}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          </motion.svg>
        )}
      </div>
      <h1 className="text-3xl font-bold">{copy[0]}</h1>
      <p className="mt-3 text-cream/65">{copy[1]}</p>
      {reg?.event && <p className="mt-4 font-display text-lg text-gold-soft">{reg.event.title}</p>}
      {reference && <p className="mt-4 font-mono text-xs text-cream/35">Ref: {reference}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-gold">
          My tickets
        </Link>
        {reg?.event?.slug && (
          <Link href={`/events/${reg.event.slug}`} className="btn-outline">
            Back to event
          </Link>
        )}
      </div>
    </motion.div>
  );
}
