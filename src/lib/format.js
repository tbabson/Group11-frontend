// Prices are integers in the smallest currency unit (kobo for NGN).
// Pass zeroLabel=null to show a zero amount (e.g. revenue) instead of the word Free.
export function money(amount, currency = 'NGN', zeroLabel = 'Free') {
  if (!amount && zeroLabel) return zeroLabel;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: (amount || 0) % 100 === 0 ? 0 : 2,
    }).format((amount || 0) / 100);
  } catch {
    return `${currency} ${((amount || 0) / 100).toLocaleString()}`;
  }
}

export const fmtDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...opts });

export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const fmtDateTime = (d) => `${fmtDate(d)} · ${fmtTime(d)}`;

export function dateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) return `${fmtDate(s, { weekday: 'short' })} · ${fmtTime(s)} – ${fmtTime(e)}`;
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${s.getDate()} – ${fmtDate(e)}`;
  return `${fmtDate(s)} – ${fmtDate(e)}`;
}

export function where(event) {
  const v = event?.venue || {};
  if (v.name || v.city) return [v.name, v.city].filter(Boolean).join(', ');
  return event?.onlineUrl ? 'Online event' : 'Venue to be announced';
}

export const lowestPrice = (tickets = []) =>
  tickets.length ? tickets.reduce((min, t) => (t.price < min.price ? t : min), tickets[0]) : null;

// Local photos used whenever an event has no uploaded banner.
const FALLBACKS = {
  conference: '/images/conference.jpg',
  tech: '/images/stage.jpg',
  business: '/images/hall.jpg',
  music: '/images/crowd.jpg',
  concert: '/images/crowd.jpg',
  festival: '/images/festival.jpg',
  party: '/images/party.jpg',
  wedding: '/images/dinner.jpg',
  gala: '/images/gala.jpg',
  dinner: '/images/dinner.jpg',
  food: '/images/dinner.jpg',
  workshop: '/images/workshop.jpg',
};
const POOL = ['/images/stage.jpg', '/images/hall.jpg', '/images/party.jpg', '/images/gala.jpg', '/images/festival.jpg', '/images/conference.jpg'];

export function bannerFor(event) {
  if (event?.bannerUrl) return event.bannerUrl;
  const cat = (event?.category || '').toLowerCase();
  if (FALLBACKS[cat]) return FALLBACKS[cat];
  const seed = [...(event?.slug || cat || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return POOL[seed % POOL.length];
}

export const titleCase = (s = '') => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const STATUS_STYLES = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  'checked-in': 'bg-sky-100 text-sky-800',
  pending: 'bg-amber-100 text-amber-800',
  waitlisted: 'bg-violet-100 text-violet-800',
  cancelled: 'bg-rose-100 text-rose-700',
  draft: 'bg-mist text-charcoal/70',
  published: 'bg-emerald-100 text-emerald-800',
  live: 'bg-gold/25 text-navy',
  completed: 'bg-sky-100 text-sky-800',
  paid: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-sky-100 text-sky-800',
  awaiting_account: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-700',
  success: 'bg-emerald-100 text-emerald-800',
  reversed: 'bg-mist text-charcoal/70',
};
