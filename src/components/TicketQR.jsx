'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { renderTicket, saveBlob } from '@/lib/ticketImage';

// The QR encodes the raw qrToken; organizers scan or paste it on the check-in screen.
// With `ticket` ({ event, ticketType, holder, status }), the whole ticket card can be saved as a PNG.
export default function TicketQR({ token, size = 180, ticket, filename = 'ticket.png' }) {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  if (!token) return null;

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      const blob = await renderTicket({ ...ticket, token, qrSvg: qrRef.current.querySelector('svg') });
      saveBlob(blob, filename);
    } catch (err) {
      setError(err.message || 'Could not download the ticket');
    } finally {
      setDownloading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code is still visible to copy by hand.
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={qrRef} className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-gold/30">
        <QRCodeSVG value={token} size={size} fgColor="#0B1E3A" level="M" />
      </div>
      <button onClick={copy} className="mt-3 max-w-full truncate font-mono text-xs text-charcoal/50 hover:text-navy" title="Copy ticket code">
        {copied ? 'Copied!' : token}
      </button>
      {ticket && (
        <button onClick={download} disabled={downloading} className="btn-navy mt-4 !px-4 !py-2">
          {downloading ? 'Preparing…' : 'Download ticket'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
