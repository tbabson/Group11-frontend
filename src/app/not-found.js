import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="navy-texture flex min-h-screen flex-col items-center justify-center px-4 text-center text-cream">
      <p className="font-display text-[8rem] font-black leading-none text-gold sm:text-[12rem]">404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">This page isn&apos;t on the guest list</h1>
      <p className="mt-4 max-w-md text-cream/60">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-10 flex gap-4">
        <Link href="/" className="btn-gold">
          Go home
        </Link>
        <Link href="/events" className="btn-outline">
          Browse events
        </Link>
      </div>
    </section>
  );
}
