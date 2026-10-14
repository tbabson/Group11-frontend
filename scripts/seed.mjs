// Creates demo accounts and published events through the API so the site has content.
// Usage: node scripts/seed.mjs   (API_ORIGIN defaults to http://localhost:4000)
// Safe to re-run: existing accounts are signed into, and events are only added once per title.
const API = `${process.env.API_ORIGIN || 'http://localhost:4000'}/api/v1`;

const ORGANIZER = { name: 'Aurum Demo Host', email: 'host@aurum-demo.test', password: 'DemoHost#2026', role: 'organizer' };
const ATTENDEE = { name: 'Ada Demo Guest', email: 'guest@aurum-demo.test', password: 'DemoGuest#2026', role: 'attendee' };

const day = 86400000;
const at = (daysFromNow, hour) => {
  const d = new Date(Date.now() + daysFromNow * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const EVENTS = [
  {
    title: 'The Midnight Gold Gala',
    category: 'gala',
    description:
      'An evening of black-tie elegance celebrating the leaders, creators and visionaries shaping the year ahead.\nExpect a candle-lit dinner, live orchestra, award presentations and a midnight toast under the chandeliers. Dress code: black tie.',
    venue: { name: 'Eko Hotel Grand Ballroom', address: 'Adetokunbo Ademola St, Victoria Island', city: 'Lagos' },
    startAt: at(21, 19),
    endAt: at(22, 1),
    capacity: 300,
    refundPolicy: 'full',
    tickets: [
      { name: 'Regular', kind: 'regular', price: 2500000, quantity: 200 },
      { name: 'VIP Table Seat', kind: 'vip', price: 7500000, quantity: 60 },
    ],
  },
  {
    title: 'Future Leaders Summit 2026',
    category: 'conference',
    description:
      'Three days of keynotes, masterclasses and conversations with the founders and executives redefining African business.\nWorkshops on leadership, capital and technology run alongside curated networking sessions and an investor showcase.',
    venue: { name: 'Landmark Centre', address: 'Water Corporation Dr, Oniru', city: 'Lagos' },
    startAt: at(35, 9),
    endAt: at(37, 18),
    capacity: 800,
    refundPolicy: 'none',
    tickets: [
      { name: 'Community Pass', kind: 'free', price: 0, quantity: 300 },
      { name: 'Delegate Pass', kind: 'regular', price: 4500000, quantity: 400 },
      { name: 'Executive Pass', kind: 'vip', price: 15000000, quantity: 100 },
    ],
  },
  {
    title: 'Sunset Garden Wedding Showcase',
    category: 'wedding',
    description:
      'Meet the planners, florists, couturiers and caterers behind the most beautiful weddings of the season.\nTaste menus, tour styled tables and book your consultations, all in one golden-hour afternoon.',
    venue: { name: 'The Wheatbaker Gardens', address: '4 Onitolo Rd, Ikoyi', city: 'Lagos' },
    startAt: at(14, 15),
    endAt: at(14, 21),
    capacity: 150,
    refundPolicy: 'full',
    tickets: [{ name: 'Guest Pass', kind: 'free', price: 0, quantity: 150 }],
  },
  {
    title: 'Abuja Jazz & Wine Evening',
    category: 'music',
    description:
      'Live jazz quartets, a sommelier-led tasting and a starlit terrace overlooking the city.\nAn intimate night for music lovers, with limited seating to keep the room warm and personal.',
    venue: { name: 'Transcorp Hilton Terrace', address: '1 Aguiyi Ironsi St, Maitama', city: 'Abuja' },
    startAt: at(28, 20),
    endAt: at(28, 23),
    capacity: 120,
    refundPolicy: 'none',
    tickets: [
      { name: 'Standard', kind: 'regular', price: 1500000, quantity: 90 },
      { name: 'Sommelier Table', kind: 'vip', price: 4000000, quantity: 30 },
    ],
  },
  {
    title: 'Masterclass: Designing Luxury Experiences',
    category: 'workshop',
    description:
      'A hands-on workshop for planners and hospitality teams on crafting premium guest journeys.\nCovers venue styling, guest flow, vendor management and the small details that make events unforgettable.',
    venue: { name: 'Aurum Studio', address: '12 Admiralty Way, Lekki Phase 1', city: 'Lagos' },
    startAt: at(10, 10),
    endAt: at(10, 16),
    capacity: 40,
    refundPolicy: 'full',
    tickets: [{ name: 'Workshop Seat', kind: 'regular', price: 3500000, quantity: 40 }],
  },
];

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status} ${json.error?.code}: ${json.error?.message}`);
    err.status = res.status;
    throw err;
  }
  return json.data;
}

async function account(user) {
  try {
    return await call('/auth/register', { method: 'POST', body: user });
  } catch (err) {
    if (err.status !== 409) throw err;
    return call('/auth/login', { method: 'POST', body: { email: user.email, password: user.password } });
  }
}

const host = await account(ORGANIZER);
await account(ATTENDEE);
const token = host.accessToken;

const existing = await call(`/events?from=2000-01-01&limit=50`);
for (const spec of EVENTS) {
  if (existing.some((e) => e.title === spec.title)) {
    console.log(`• exists   ${spec.title}`);
    continue;
  }
  const { tickets, ...body } = spec;
  const event = await call('/events', { method: 'POST', body, token });
  for (const t of tickets) await call(`/events/${event._id}/tickets`, { method: 'POST', body: t, token });
  await call(`/events/${event._id}/publish`, { method: 'POST', token });
  console.log(`✓ created  ${spec.title}  →  /events/${event.slug}`);
}

console.log(`\nOrganizer: ${ORGANIZER.email} / ${ORGANIZER.password}`);
console.log(`Attendee:  ${ATTENDEE.email} / ${ATTENDEE.password}`);
