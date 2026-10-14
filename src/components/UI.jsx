'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STATUS_STYLES } from '@/lib/format';

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gold">
      <Spinner className="h-8 w-8" />
      <p className="font-ui text-sm text-charcoal/60">{label}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize font-ui ${
        STATUS_STYLES[status] || 'bg-mist text-charcoal'
      }`}
    >
      {String(status).replace('_', ' ')}
    </span>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-rose-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-charcoal/50">{hint}</span>
      )}
    </label>
  );
}

// A password input with an eye button that toggles the value between hidden and visible.
export function PasswordInput({ className = 'input', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-charcoal/50 transition hover:text-navy focus-visible:text-gold focus-visible:outline-none"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  const styles = {
    error: 'bg-rose-50 text-rose-700 ring-rose-200',
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    info: 'bg-gold/10 text-white ring-gold/30',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl px-4 py-3 text-sm ring-1 ${styles[kind]}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </motion.div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl sm:p-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-navy">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-charcoal/50 hover:bg-mist hover:text-navy" aria-label="Close">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7l2-3h12l2 3M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-navy">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-charcoal/60">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Dark page header used on app pages (dashboard, organizer, auth-less lists).
export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <section className="navy-texture pb-14 pt-32 text-cream">
      <div className="container-x flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-cream/70">{subtitle}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
