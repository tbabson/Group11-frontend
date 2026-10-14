# Aurum Events — Frontend

Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion frontend for the **Group11 event** API.

## Run it

```bash
# 1. Start the API (in ../Group11 event):  npm run dev   → http://localhost:4001
# 2. Then here:
npm install
npm run dev            # http://localhost:5002
```

Port **5002** matches the API's `CLIENT_URL`, so password-reset emails and
payment callbacks (`/reset-password`, `/payments/callback`) land on this app.

Browser calls go to `/api/v1/*` on this origin and Next proxies them to `API_ORIGIN`
(see `.env.example`, default `http://localhost:4001`), so there are no CORS issues.

### Demo data

```bash
node scripts/seed.mjs
```

Creates five published events plus two accounts (re-runnable):

| Role | Email | Password |
| --- | --- | --- |
| Organizer | host@aurum-demo.test | DemoHost#2026 |
| Attendee | guest@aurum-demo.test | DemoGuest#2026 |

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page: full-bleed hero, search, upcoming events, categories |
| `/events` | Browse with search, category, city, date, price filters and pagination |
| `/events/[slug]` | Single event page (dark, immersive): countdown, highlights, programme, ticket tiers, FAQ |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth |
| `/dashboard` | Attendee tickets: QR codes, complete payment, cancel |
| `/payments/callback` | Return page after Paystack / demo checkout |
| `/organizer` | Organizer's events |
| `/organizer/events/new` | Create event (draft) |
| `/organizer/events/[slug]` | Manage: stats, edit, banner upload, ticket tiers, guest list + CSV, door check-in |
| `/organizer/payouts` | Bank account and payout history |
| `/admin` | Revenue, users, payouts (admin only) |

## Design

- Colours: Midnight Navy `#0B1E3A`, Royal Gold `#D4A017`, Soft Gold `#E8C76A`, Warm White `#FAF8F2`,
  Light Gray `#E9EDF3`, Charcoal `#1F2937` — defined as Tailwind tokens in `src/app/globals.css`.
- Fonts: Playfair Display (headings), Inter (body), Montserrat SemiBold (buttons/navigation).
- Brand name lives in `src/lib/site.js`.

## Notes

- The organizer dashboard uses `GET /me/events`. It lists every event the organizer owns in any
  status (admins see all events), and the API calculates the dashboard counts (total, live &
  upcoming, drafts, completed, cancelled). Click a card to filter the list.
- The admin Revenue tab shows platform totals plus a per-event breakdown from
  `GET /admin/revenue/events`: gross, platform fee, organizer share, refunds and payout state.
  You can sort, search and page through it.
- Camera QR scanning on the check-in tab uses the browser `BarcodeDetector` API (Chrome/Edge on
  Android and macOS). Elsewhere, paste or type the ticket code.
