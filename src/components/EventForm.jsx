'use client';

import { useState } from 'react';
import { Alert, Field, Spinner } from './UI';
import { fieldErrors } from '@/lib/api';
import { CATEGORIES } from '@/lib/site';

// <input type="datetime-local"> wants local time without a zone.
export function toLocalInput(d) {
  if (!d) return '';
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initial(event) {
  return {
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category || '',
    venueName: event?.venue?.name || '',
    venueAddress: event?.venue?.address || '',
    venueCity: event?.venue?.city || '',
    onlineUrl: event?.onlineUrl || '',
    startAt: toLocalInput(event?.startAt),
    endAt: toLocalInput(event?.endAt),
    capacity: event?.capacity ?? '',
    refundPolicy: event?.refundPolicy || 'none',
  };
}

// The API rejects unknown and empty fields, so build the payload carefully.
function toPayload(form) {
  const venue = {};
  if (form.venueName.trim()) venue.name = form.venueName.trim();
  if (form.venueAddress.trim()) venue.address = form.venueAddress.trim();
  if (form.venueCity.trim()) venue.city = form.venueCity.trim();
  const body = {
    title: form.title.trim(),
    description: form.description,
    category: form.category.trim(),
    startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
    endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    capacity: Number(form.capacity),
    refundPolicy: form.refundPolicy,
  };
  if (Object.keys(venue).length) body.venue = venue;
  if (form.onlineUrl.trim()) body.onlineUrl = form.onlineUrl.trim();
  return body;
}

// Only send what changed when editing (startAt must stay in the future if it is sent).
function diff(next, prev) {
  const out = {};
  Object.entries(next).forEach(([k, v]) => {
    if (JSON.stringify(v) !== JSON.stringify(prev[k])) out[k] = v;
  });
  return out;
}

// `children` renders extra fields (e.g. the banner picker on the create page) after the main details.
export default function EventForm({ event, submitLabel = 'Save', onSubmit, children }) {
  const [form, setForm] = useState(() => initial(event));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError('');
    setSaved('');
    let body = toPayload(form);
    if (event) {
      body = diff(body, toPayload(initial(event)));
      if (!Object.keys(body).length) return setSaved('Nothing to update.');
    }
    setBusy(true);
    try {
      await onSubmit(body);
      if (event) setSaved('Changes saved.');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.code === 'VALIDATION_ERROR' && err.details.length ? 'Please fix the highlighted fields.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Alert>{error}</Alert>
      <Alert kind="success">{saved}</Alert>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Event title" error={errors.title}>
            <input className="input" required minLength={3} maxLength={200} value={form.title} onChange={set('title')} placeholder="The Midnight Gala 2026" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Description" error={errors.description} hint="The first sentence is used as the headline statement on your event page.">
            <textarea className="input min-h-36" maxLength={10000} value={form.description} onChange={set('description')} />
          </Field>
        </div>
        <Field label="Category" error={errors.category}>
          <input className="input" required list="categories" value={form.category} onChange={set('category')} placeholder="gala" />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </datalist>
        </Field>
        <Field label="Capacity" error={errors.capacity}>
          <input type="number" min={1} required className="input" value={form.capacity} onChange={set('capacity')} />
        </Field>
        <Field label="Starts" error={errors.startAt}>
          <input type="datetime-local" required className="input" value={form.startAt} onChange={set('startAt')} />
        </Field>
        <Field label="Ends" error={errors.endAt}>
          <input type="datetime-local" required className="input" value={form.endAt} onChange={set('endAt')} />
        </Field>
      </div>

      {children}

      <fieldset className="rounded-2xl border border-navy/10 p-5">
        <legend className="px-2 font-ui text-sm font-semibold text-navy">Location</legend>
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Venue name" error={errors.venue || errors['venue.name']}>
            <input className="input" value={form.venueName} onChange={set('venueName')} placeholder="Eko Hotel" />
          </Field>
          <Field label="Address" error={errors['venue.address']}>
            <input className="input" value={form.venueAddress} onChange={set('venueAddress')} />
          </Field>
          <Field label="City" error={errors['venue.city']}>
            <input className="input" value={form.venueCity} onChange={set('venueCity')} placeholder="Lagos" />
          </Field>
          <div className="md:col-span-3">
            <Field label="Online link (optional)" error={errors.onlineUrl} hint="Provide a venue, an online link, or both.">
              <input type="url" className="input" value={form.onlineUrl} onChange={set('onlineUrl')} placeholder="https://" />
            </Field>
          </div>
        </div>
      </fieldset>

      <Field label="Refund policy" error={errors.refundPolicy}>
        <select className="input" value={form.refundPolicy} onChange={set('refundPolicy')}>
          <option value="none">No refunds (unless the event is cancelled)</option>
          <option value="full">Full refund when a guest cancels</option>
        </select>
      </Field>

      <button className="btn-gold" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} {submitLabel}
      </button>
    </form>
  );
}
