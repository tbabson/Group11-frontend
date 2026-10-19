'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import { isLive } from './format';

// Longest timer we schedule (browsers misbehave above ~24 days; an hour is plenty).
const MAX_WAIT_MS = 60 * 60 * 1000;

// Returns the current time, updated the moment the next of `events` ends (and at most
// hourly), so components re-render exactly when an event stops being live.
export function useEndTicker(events) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const ends = (events || []).map((e) => new Date(e.endAt).getTime()).filter((t) => t > now);
    if (!ends.length) return undefined;
    const wait = Math.min(Math.max(0, Math.min(...ends) - Date.now()) + 250, MAX_WAIT_MS);
    const t = setTimeout(() => setNow(Date.now()), wait);
    return () => clearTimeout(t);
  }, [events, now]);
  return now;
}

// Events in progress right now. Re-fetched every `refreshMs` (new events that start,
// cancellations) and each one is dropped the instant it ends, without a page reload.
// Returns null while loading, then an array.
export function useLiveEvents({ limit = 6, refreshMs = 60 * 1000 } = {}) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api('/events', { query: { when: 'live', limit, sort: 'startAt' }, auth: false })
        .then(({ data }) => !cancelled && setEvents(data))
        .catch(() => !cancelled && setEvents((prev) => prev || []));
    load();
    const timer = setInterval(load, refreshMs);
    // Coming back to a tab that sat in the background: refresh straight away.
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [limit, refreshMs]);

  const now = useEndTicker(events);
  return events && events.filter((e) => isLive(e, new Date(now)));
}
