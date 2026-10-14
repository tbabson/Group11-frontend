'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toLocalInput } from '../EventForm';
import { Alert, Field, Modal, Spinner } from '../UI';
import { api, fieldErrors } from '@/lib/api';
import { fmtDateTime, money, titleCase } from '@/lib/format';

const EMPTY = { name: '', kind: 'regular', price: '', quantity: '', saleStart: '', saleEnd: '' };

export default function TicketManager({ event, onChange }) {
  const [editing, setEditing] = useState(null); // null | 'new' | ticket
  const closed = ['cancelled', 'completed'].includes(event.status);
  const allocated = event.ticketTypes.reduce((n, t) => n + t.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy">Ticket tiers</h2>
          <p className="text-sm text-charcoal/60">
            {allocated} of {event.capacity} seats allocated across tiers.
          </p>
        </div>
        {!closed && (
          <button className="btn-gold" onClick={() => setEditing('new')}>
            + Add ticket tier
          </button>
        )}
      </div>

      {event.ticketTypes.length === 0 ? (
        <div className="card p-10 text-center text-charcoal/60">No tiers yet. Add a Free, Regular or VIP ticket so guests can register.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {event.ticketTypes.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative overflow-hidden rounded-2xl p-6 ${t.kind === 'vip' ? 'bg-navy text-cream' : 'card'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-ui text-xs font-semibold uppercase tracking-widest ${t.kind === 'vip' ? 'text-gold' : 'text-charcoal/50'}`}>{t.kind === 'vip' ? 'VIP' : titleCase(t.kind)}</p>
                    <h3 className={`mt-1 text-xl font-bold ${t.kind === 'vip' ? '' : 'text-navy'}`}>{t.name}</h3>
                  </div>
                  <p className={`font-display text-2xl font-bold ${t.kind === 'vip' ? 'text-gold' : 'text-navy'}`}>{money(t.price, t.currency)}</p>
                </div>
                <dl className={`mt-5 grid grid-cols-2 gap-3 text-sm ${t.kind === 'vip' ? 'text-cream/70' : 'text-charcoal/65'}`}>
                  <div>
                    <dt className="text-xs opacity-70">Sold</dt>
                    <dd className="font-semibold">
                      {t.sold} / {t.quantity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs opacity-70">Available</dt>
                    <dd className="font-semibold">{t.available}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs opacity-70">On sale</dt>
                    <dd>
                      {fmtDateTime(t.saleStart)} → {fmtDateTime(t.saleEnd)}
                    </dd>
                  </div>
                </dl>
                {!closed && (
                  <button onClick={() => setEditing(t)} className={`mt-5 font-ui text-sm font-semibold ${t.kind === 'vip' ? 'text-gold-soft hover:text-gold' : 'text-gold hover:text-navy'}`}>
                    Edit tier →
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New ticket tier' : 'Edit ticket tier'}>
        {editing && (
          <TicketForm
            event={event}
            ticket={editing === 'new' ? null : editing}
            onDone={() => {
              setEditing(null);
              onChange();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function TicketForm({ event, ticket, onDone }) {
  const [form, setForm] = useState(() =>
    ticket
      ? {
          name: ticket.name,
          kind: ticket.kind,
          price: ticket.price ? String(ticket.price / 100) : '',
          quantity: String(ticket.quantity),
          saleStart: toLocalInput(ticket.saleStart),
          saleEnd: toLocalInput(ticket.saleEnd),
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const body = {
      name: form.name.trim(),
      kind: form.kind,
      // Entered in Naira, stored in kobo.
      price: form.kind === 'free' ? 0 : Math.round(Number(form.price) * 100),
      quantity: Number(form.quantity),
    };
    if (form.saleStart) body.saleStart = new Date(form.saleStart).toISOString();
    if (form.saleEnd) body.saleEnd = new Date(form.saleEnd).toISOString();
    if (ticket) {
      // Only send changes: the API refuses any price/kind field once tickets have sold.
      const prev = { name: ticket.name, kind: ticket.kind, price: ticket.price, quantity: ticket.quantity, saleStart: new Date(ticket.saleStart).toISOString(), saleEnd: new Date(ticket.saleEnd).toISOString() };
      Object.keys(body).forEach((k) => body[k] === prev[k] && delete body[k]);
      if (!Object.keys(body).length) return onDone();
    }
    try {
      if (ticket) await api(`/tickets/${ticket._id}`, { method: 'PATCH', body });
      else await api(`/events/${event._id}/tickets`, { method: 'POST', body });
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <Field label="Tier name" error={errors.name}>
        <input className="input" required value={form.name} onChange={set('name')} placeholder="Early Bird" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" error={errors.kind}>
          <select className="input" value={form.kind} onChange={set('kind')}>
            <option value="free">Free</option>
            <option value="regular">Regular</option>
            <option value="vip">VIP</option>
          </select>
        </Field>
        <Field label="Price (₦)" error={errors.price}>
          <input
            type="number"
            min={form.kind === 'free' ? 0 : 1}
            step="0.01"
            className="input"
            disabled={form.kind === 'free'}
            required={form.kind !== 'free'}
            value={form.kind === 'free' ? '' : form.price}
            onChange={set('price')}
            placeholder={form.kind === 'free' ? 'Free' : '5000'}
          />
        </Field>
      </div>
      <Field label="Quantity" error={errors.quantity}>
        <input type="number" min={1} required className="input" value={form.quantity} onChange={set('quantity')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sales start" error={errors.saleStart} hint="Default: now">
          <input type="datetime-local" className="input" value={form.saleStart} onChange={set('saleStart')} />
        </Field>
        <Field label="Sales end" error={errors.saleEnd} hint="Default: event start">
          <input type="datetime-local" className="input" value={form.saleEnd} onChange={set('saleEnd')} />
        </Field>
      </div>
      <button className="btn-gold w-full" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} {ticket ? 'Save tier' : 'Add tier'}
      </button>
    </form>
  );
}
