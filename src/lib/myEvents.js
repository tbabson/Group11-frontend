import { api } from './api';

// Dashboard buckets understood by GET /me/events (undefined = all events).
export const EVENT_BUCKETS = [
  [undefined, 'Total events'],
  ['live', 'Live & upcoming'],
  ['draft', 'Drafts'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

// The organizer's events in every status (all events for an admin), with counts for the
// dashboard cards in meta.summary: { total, live, draft, completed, cancelled }.
export async function fetchMyEvents({ status, q, page = 1, limit = 20 } = {}) {
  const { data, meta } = await api('/me/events', { query: { status, q, page, limit } });
  return { items: data, total: meta.total, summary: meta.summary };
}

// Label shown on an event card. A published event that has ended counts as completed even
// before the API's hourly job updates its status; one that is happening now shows as live.
export function displayStatus(event, now = new Date()) {
  if (event.status !== 'published') return event.status;
  if (new Date(event.endAt) <= now) return 'completed';
  if (new Date(event.startAt) <= now) return 'live';
  return 'published';
}
