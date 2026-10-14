'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, PasswordInput, Spinner } from '@/components/UI';
import { fieldErrors } from '@/lib/api';
import { useAuth, homeFor } from '@/lib/auth';

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Join to reserve seats, or host events of your own." image="/images/party.jpg" quote="Your seat at the table is waiting.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}

const ROLES = [
  { value: 'attendee', title: 'Attend events', text: 'Book tickets and keep them in one place' },
  { value: 'organizer', title: 'Host events', text: 'Sell tickets and check guests in' },
];

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: params.get('role') === 'organizer' ? 'organizer' : 'attendee',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const user = await register(form);
      router.push(homeFor(user));
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.code === 'VALIDATION_ERROR' ? 'Please check the highlighted fields.' : err.message);
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-5">
      <Alert>{error}</Alert>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
        {ROLES.map((r) => {
          const active = form.role === r.value;
          return (
            <button
              type="button"
              key={r.value}
              role="radio"
              aria-checked={active}
              onClick={() => setForm((f) => ({ ...f, role: r.value }))}
              className={`relative rounded-2xl p-4 text-left ring-1 transition ${active ? 'bg-navy text-cream ring-navy' : 'bg-white ring-navy/10 hover:ring-gold'}`}
            >
              {active && <motion.span layoutId="role-ring" className="absolute inset-0 rounded-2xl ring-2 ring-gold" />}
              <span className={`block font-ui text-sm font-semibold ${active ? 'text-gold' : 'text-navy'}`}>{r.title}</span>
              <span className={`mt-1 block text-xs ${active ? 'text-cream/70' : 'text-charcoal/55'}`}>{r.text}</span>
            </button>
          );
        })}
      </div>
      <Field label="Full name" error={errors.name}>
        <input required autoComplete="name" className="input" value={form.name} onChange={set('name')} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} />
      </Field>
      <Field label="Password" error={errors.password} hint="At least 8 characters">
        <PasswordInput required minLength={8} autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />
      </Field>
      <button className="btn-gold w-full" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} Create account
      </button>
      <p className="text-center text-sm text-charcoal/60">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-navy hover:text-gold">
          Sign in
        </Link>
      </p>
    </form>
  );
}
