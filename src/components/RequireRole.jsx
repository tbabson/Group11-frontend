'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, homeFor } from '@/lib/auth';
import { PageLoader } from './UI';

// Client-side guard: sends signed-out users to /login and wrong roles to their own home.
export default function RequireRole({ roles, children }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = Boolean(user && (!roles || roles.includes(user.role)));

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace(homeFor(user));
  }, [ready, user, allowed, router, pathname]);

  if (!ready || !allowed) {
    return (
      <div className="pt-24">
        <PageLoader />
      </div>
    );
  }
  return children;
}
