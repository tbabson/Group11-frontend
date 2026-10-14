'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, PasswordInput, Spinner } from '@/components/UI';
import { useAuth, homeFor } from '@/lib/auth';

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your tickets and events.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

// Only follow same-site paths after login.
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form);
      router.push(safeNext(params.get('next')) || homeFor(user));
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect email or password.' : err.message);
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-5">
      <Alert>{error}</Alert>
      <Field label="Email">
        <input type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} />
      </Field>
      <Field label="Password">
        <PasswordInput required autoComplete="current-password" className="input" value={form.password} onChange={set('password')} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-gold hover:text-navy">
          Forgot password?
        </Link>
      </div>
      <button className="btn-gold w-full" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} Sign in
      </button>
      <p className="text-center text-sm text-charcoal/60">
        New here?{' '}
        <Link href="/register" className="font-semibold text-navy hover:text-gold">
          Create an account
        </Link>
      </p>
    </form>
  );
}
