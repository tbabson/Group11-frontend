'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, PasswordInput, Spinner } from '@/components/UI';
import { api, fieldErrors } from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something at least 8 characters long." image="/images/hall.jpg">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}

function ResetForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <Alert>This reset link is missing its token. Request a new one.</Alert>
        <Link href="/forgot-password" className="btn-navy w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    try {
      const { data } = await api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false });
      setDone(data.message);
    } catch (err) {
      setError(fieldErrors(err).password || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6">
        <Alert kind="success">{done}</Alert>
        <Link href="/login" className="btn-gold w-full">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Alert>{error}</Alert>
      <Field label="New password">
        <PasswordInput required minLength={8} autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password">
        <PasswordInput required minLength={8} autoComplete="new-password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <button className="btn-gold w-full" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} Update password
      </button>
    </form>
  );
}
