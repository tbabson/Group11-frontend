'use client';

import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

// Fades and lifts its children into view the first time they scroll on screen.
export function Reveal({ children, delay = 0, y = 32, className, as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </Tag>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

export const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

// Wraps a grid so its direct <motion.* variants={rise}> children animate in one after another.
export function Stagger({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', dark = false }) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <Reveal className={`max-w-3xl ${alignCls}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className={`text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl ${dark ? 'text-cream' : 'text-navy'}`}>
        {title}
      </h2>
      {subtitle && <p className={`mt-4 text-base sm:text-lg ${dark ? 'text-cream/70' : 'text-charcoal/70'}`}>{subtitle}</p>}
    </Reveal>
  );
}
