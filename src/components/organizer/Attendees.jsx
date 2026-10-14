'use client';

import { useEffect, useState } from 'react';
import { Alert, PageLoader, Spinner, StatusBadge } from '../UI';
import { api, downloadFile } from '@/lib/api';
import { fmtDateTime, money } from '@/lib/format';

const LIMIT = 20;
const STATUSES = ['', 'confirmed', 'checked-in', 'pending', 'waitlisted', 'cancelled'];

export default function Attendees({ event }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setData(null);
    api(`/events/${event._id}/attendees`, { query: { status, page, limit: LIMIT } })
      .then(({ data: items, meta }) => setData({ items, total: meta.total }))
      .catch((err) => {
        setError(err.message);
        setData({ items: [], total: 0 });
      });
  }, [event._id, status, page]);

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadFile(`/events/${event._id}/attendees.csv`, `${event.slug}-attendees.csv`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-mist p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy">Guest list</h2>
          <p className="text-sm text-charcoal/60">{data ? `${data.total} registration${data.total === 1 ? '' : 's'}` : ' '}</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input !w-auto !py-2.5"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace('-', ' ') : 'All statuses'}
              </option>
            ))}
          </select>
          <button onClick={download} className="btn-navy !py-2.5" disabled={downloading}>
            {downloading && <Spinner className="h-4 w-4" />} Export CSV
          </button>
        </div>
      </div>
      {error && (
        <div className="p-6">
          <Alert>{error}</Alert>
        </div>
      )}
      {!data ? (
        <PageLoader />
      ) : data.items.length === 0 ? (
        <p className="p-10 text-center text-charcoal/60">No registrations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
              <tr>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Ticket</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Registered</th>
                <th className="px-6 py-3">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r._id} className="border-t border-mist hover:bg-cream">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-navy">{r.user?.name}</p>
                    <p className="text-charcoal/55">{r.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {r.ticketType?.name} <span className="text-charcoal/50">· {money(r.ticketType?.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-charcoal/65">{fmtDateTime(r.createdAt)}</td>
                  <td className="px-6 py-4 text-charcoal/65">{r.checkedInAt ? fmtDateTime(r.checkedInAt) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-mist p-4">
          <button className="btn-ghost !py-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Prev
          </button>
          <span className="font-ui text-sm text-charcoal/60">
            {page} / {pages}
          </span>
          <button className="btn-ghost !py-2" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
