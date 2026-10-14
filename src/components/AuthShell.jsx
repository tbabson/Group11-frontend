'use client';

import { motion } from 'framer-motion';

export default function AuthShell({ title, subtitle, image = '/images/gala.jpg', quote, children }) {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep/90 via-navy/75 to-navy/40" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute inset-x-12 bottom-16 text-cream"
        >
          <div className="mb-6 h-px w-20 bg-gold" />
          <p className="font-display text-4xl font-bold leading-tight">{quote || 'Every great evening starts with a single invitation.'}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center bg-cream px-4 pb-16 pt-28 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <h1 className="text-4xl font-bold text-navy">{title}</h1>
          {subtitle && <p className="mt-2 text-charcoal/65">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </section>
  );
}
