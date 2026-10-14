'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner } from '../UI';
import { api } from '@/lib/api';
import { fmtTime } from '@/lib/format';

// Door check-in. Organizers paste/type a ticket code, or scan it with the camera on
// browsers that support the BarcodeDetector API (Chrome on Android/macOS, Edge, …).
export default function CheckIn({ event }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setCanScan(typeof window !== 'undefined' && 'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const checkIn = async (token) => {
    const qrToken = token.trim();
    if (!qrToken || busy) return;
    setBusy(true);
    try {
      const { data } = await api(`/events/${event._id}/check-in`, { method: 'POST', body: { qrToken } });
      const entry = { ok: true, title: data.attendee?.name || 'Guest', text: `${data.ticketType?.name || 'Ticket'} · checked in ${fmtTime(data.checkedInAt)}` };
      setResult(entry);
      setLog((l) => [entry, ...l].slice(0, 8));
    } catch (err) {
      const title = err.code === 'TICKET_ALREADY_USED' ? 'Already checked in' : err.status === 404 ? 'Ticket not found' : 'Check-in failed';
      setResult({ ok: false, title, text: err.message });
    } finally {
      setBusy(false);
      setCode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="navy-texture rounded-3xl p-8 text-cream">
        <p className="eyebrow">Door mode</p>
        <h2 className="mt-2 text-3xl font-bold">Check guests in</h2>
        <p className="mt-2 text-cream/60">Scan the guest&apos;s QR code or paste the ticket code below. Each ticket works once.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkIn(code);
          }}
          className="mt-8 flex gap-2"
        >
          <input
            ref={inputRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input !bg-cream/10 !text-cream placeholder:!text-cream/40 focus:!bg-cream/15"
            placeholder="Ticket code"
            aria-label="Ticket code"
          />
          <button className="btn-gold shrink-0" disabled={busy || !code.trim()}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Check in'}
          </button>
        </form>

        {canScan && (
          <button onClick={() => setScanning((s) => !s)} className="btn-outline mt-4 w-full">
            {scanning ? 'Stop camera' : 'Scan with camera'}
          </button>
        )}
        {scanning && <Scanner onCode={checkIn} />}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.title + result.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`mt-8 flex items-center gap-4 rounded-2xl p-5 ${result.ok ? 'bg-emerald-500/15 ring-1 ring-emerald-400/40' : 'bg-rose-500/15 ring-1 ring-rose-400/40'}`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${result.ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {result.ok ? '✓' : '!'}
              </span>
              <div>
                <p className="text-lg font-semibold">{result.title}</p>
                <p className="text-sm text-cream/70">{result.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card p-8">
        <h3 className="text-xl font-bold text-navy">Recent check-ins</h3>
        {log.length === 0 ? (
          <p className="mt-4 text-charcoal/55">Successful check-ins from this session appear here.</p>
        ) : (
          <ul className="mt-5 divide-y divide-mist">
            <AnimatePresence initial={false}>
              {log.map((entry, i) => (
                <motion.li key={log.length - i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold text-navy">{entry.title}</p>
                    <p className="text-sm text-charcoal/55">{entry.text}</p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

function Scanner({ onCode }) {
  const videoRef = useRef(null);
  const onCodeRef = useRef(onCode);
  const [error, setError] = useState('');
  onCodeRef.current = onCode;

  useEffect(() => {
    let stream;
    let raf;
    let last = '';
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped) return;
          try {
            const [hit] = await detector.detect(videoRef.current);
            // Ignore the same code while it stays in frame.
            if (hit?.rawValue && hit.rawValue !== last) {
              last = hit.rawValue;
              onCodeRef.current(hit.rawValue);
            }
          } catch {
            // Frame not ready yet.
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError('Camera unavailable. Allow camera access or type the code instead.');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-gold/30">
      {error ? <p className="p-4 text-sm text-rose-200">{error}</p> : <video ref={videoRef} className="aspect-video w-full bg-black object-cover" muted playsInline />}
    </div>
  );
}
