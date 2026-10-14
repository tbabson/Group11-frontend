'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, Spinner } from '@/components/UI';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link." image="/images/hall.jpg">
      {message ? (
        <div className="space-y-6">
          <Alert kind="success">{message}</Alert>
          <Link href="/login" className="btn-navy w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Alert>{error}</Alert>
          <Field label="Email">
            <input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn-gold w-full" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Send reset link
          </button>
          <p className="text-center text-sm">
            <Link href="/login" className="font-semibold text-navy hover:text-gold">
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
