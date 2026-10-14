'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import { Reveal } from '@/components/Motion';
import { Alert, Field, PageHeader, PageLoader, Spinner, StatusBadge } from '@/components/UI';
import { api, fieldErrors } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';

// Paystack bank codes for common Nigerian banks.
const BANKS = [
  ['044', 'Access Bank'],
  ['050', 'Ecobank Nigeria'],
  ['070', 'Fidelity Bank'],
  ['011', 'First Bank of Nigeria'],
  ['214', 'First City Monument Bank'],
  ['058', 'Guaranty Trust Bank'],
  ['50211', 'Kuda Bank'],
  ['50515', 'Moniepoint MFB'],
  ['999992', 'OPay'],
  ['076', 'Polaris Bank'],
  ['221', 'Stanbic IBTC Bank'],
  ['232', 'Sterling Bank'],
  ['032', 'Union Bank of Nigeria'],
  ['033', 'United Bank for Africa'],
  ['035', 'Wema Bank'],
  ['057', 'Zenith Bank'],
];

export default function PayoutsPage() {
  return (
    <RequireRole roles={['organizer', 'admin']}>
      <Payouts />
    </RequireRole>
  );
}

function Payouts() {
  const [me, setMe] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/me').then(({ data }) => setMe(data)).catch((err) => setError(err.message));
    api('/me/payouts', { query: { limit: 50 } })
      .then(({ data }) => setPayouts(data))
      .catch((err) => {
        setError(err.message);
        setPayouts([]);
      });
  }, []);

  return (
    <>
      <PageHeader eyebrow="Earnings" title="Payouts" subtitle="Ticket earnings are held until a few days after each event ends, then sent to your bank account.">
        <Link href="/organizer" className="btn-outline">
          ← Dashboard
        </Link>
      </PageHeader>
      <section className="py-12">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_2fr]">
          <Reveal>{me ? <AccountForm me={me} onSaved={setMe} /> : <PageLoader />}</Reveal>
          <Reveal delay={0.1} className="card overflow-hidden">
            <div className="border-b border-mist p-6">
              <h2 className="text-2xl font-bold text-navy">Payout history</h2>
            </div>
            <div className="p-6">
              <Alert>{error}</Alert>
            </div>
            {!payouts ? (
              <PageLoader />
            ) : payouts.length === 0 ? (
              <p className="px-6 pb-10 text-center text-charcoal/60">No payouts yet. They appear after your first paid event has ended and the hold period passes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-mist/60 font-ui text-xs uppercase tracking-wider text-charcoal/55">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Gross</th>
                      <th className="px-6 py-3">You receive</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p._id} className="border-t border-mist">
                        <td className="px-6 py-4 font-semibold text-navy">{p.event?.title || '–'}</td>
                        <td className="px-6 py-4">{money(p.grossAmount, p.currency, null)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-700">{money(p.amount, p.currency, null)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-charcoal/60">{p.paidAt ? fmtDate(p.paidAt) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

function AccountForm({ me, onSaved }) {
  const current = me.payoutAccount;
  const [form, setForm] = useState({ bankCode: current?.bankCode || '', accountNumber: '', accountName: current?.accountName || '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    setSaved('');
    try {
      const { data } = await api('/me/payout-account', { method: 'PUT', body: form });
      onSaved(data);
      setSaved('Payout account saved.');
      setForm((f) => ({ ...f, accountNumber: '' }));
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="navy-texture rounded-3xl p-8 text-cream">
      <p className="eyebrow">Bank account</p>
      <h2 className="mt-2 text-2xl font-bold">Where we send your money</h2>
      {current ? (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-navy-deep/40 p-4">
          <p className="text-sm text-cream/60">Current account</p>
          <p className="font-semibold">{current.accountName}</p>
          <p className="font-mono text-sm text-gold-soft">
            {BANKS.find(([c]) => c === current.bankCode)?.[1] || `Bank ${current.bankCode}`} · {current.accountNumber}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-cream/60">No account yet. Payouts will wait until you add one.</p>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4 [&_.label]:text-cream/80">
        <Alert>{error}</Alert>
        <Alert kind="success">{saved}</Alert>
        <Field label="Bank" error={errors.bankCode}>
          <select required className="input" value={form.bankCode} onChange={set('bankCode')}>
            <option value="">Select bank</option>
            {BANKS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Account number" error={errors.accountNumber}>
          <input required inputMode="numeric" pattern="\d{10}" maxLength={10} className="input" value={form.accountNumber} onChange={set('accountNumber')} placeholder="10-digit NUBAN" />
        </Field>
        <Field label="Account name" error={errors.accountName}>
          <input required minLength={2} className="input" value={form.accountName} onChange={set('accountName')} />
        </Field>
        <button className="btn-gold w-full" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {current ? 'Update account' : 'Save account'}
        </button>
      </form>
    </div>
  );
}
