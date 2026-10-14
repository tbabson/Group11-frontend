import { bannerFor, fmtDate, fmtTime, money, titleCase, where } from './format';
import { SITE } from './site';

// Draws the full ticket card (banner, event details, holder, QR code) onto a canvas and
// returns it as a PNG blob. Everything is drawn in the browser, so it works without the API.
const W = 900;
const SCALE = 2; // export at 2x for crisp printing
const PAD = 56;

const C = {
  navy: '#0B1E3A',
  navyDeep: '#07142A',
  navyLight: '#142C52',
  gold: '#D4A017',
  goldSoft: '#E8C76A',
  cream: '#FAF8F2',
  muted: 'rgba(250,248,242,0.6)',
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Cloudinary banners send CORS headers; local images are same-origin
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // fall back to a plain navy header
    img.src = src;
  });
}

// The QR is already on screen as an <svg>; turn that markup into an image we can draw.
function svgToImage(svg) {
  const markup = new XMLSerializer().serializeToString(svg);
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);
}

function fontFamily(varName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Draws an image like CSS object-fit: cover.
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

// Splits text into at most `maxLines` lines that fit `maxWidth`, adding … if it was cut.
function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  return lines;
}

/**
 * @param {object} t
 * @param {object} t.event       { title, slug, category, startAt, endAt, venue, onlineUrl, bannerUrl }
 * @param {object} t.ticketType  { name, kind, price, currency }
 * @param {string} t.holder      attendee name
 * @param {string} t.token       QR token
 * @param {string} [t.status]    registration status
 * @param {SVGElement} t.qrSvg   the rendered QR code
 */
export async function renderTicket({ event = {}, ticketType = {}, holder, token, status = 'confirmed', qrSvg }) {
  await document.fonts.ready;
  const display = fontFamily('--font-display', 'sans-serif');
  const sans = fontFamily('--font-sans', 'sans-serif');
  const ui = fontFamily('--font-ui', 'sans-serif');

  // Measure first so the card height fits its content (long titles/venues wrap).
  const title = String(event.title || 'Event').toUpperCase();
  const m = document.createElement('canvas').getContext('2d');
  m.font = `800 54px ${display}`;
  const titleCount = wrap(m, title, W - PAD * 2, 3).length;
  m.font = `600 26px ${sans}`;
  const venueCount = wrap(m, where(event), W - PAD * 2 - 24, 2).length;
  const holderTop = 368 + titleCount * 60 + 24 + 100 + 68 + venueCount * 32 + 100;
  const perfY = holderTop + 110;
  const H = perfY + 50 + 300 + 56;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  // Fill outside the card too: many image viewers show transparent pixels as black.
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);

  const [banner, qr] = await Promise.all([loadImage(bannerFor(event)), svgToImage(qrSvg)]);

  // Card body, clipped to rounded corners.
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 40);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.navy);
  bg.addColorStop(1, C.navyDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Banner with a navy fade.
  const bannerH = 360;
  if (banner) drawCover(ctx, banner, 0, 0, W, bannerH);
  const fade = ctx.createLinearGradient(0, 0, 0, bannerH);
  fade.addColorStop(0, 'rgba(7,20,42,0.55)');
  fade.addColorStop(0.55, 'rgba(11,30,58,0.45)');
  fade.addColorStop(1, C.navy);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, bannerH);

  // Brand + category.
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.cream;
  ctx.font = `700 30px ${display}`;
  ctx.fillText(SITE.name, PAD, 70);
  const brandW = ctx.measureText(SITE.name).width;
  ctx.fillStyle = C.gold;
  ctx.font = `600 14px ${ui}`;
  ctx.letterSpacing = '5px';
  ctx.fillText(SITE.suffix.toUpperCase(), PAD + brandW + 12, 73);

  if (event.category) {
    ctx.font = `600 15px ${ui}`;
    ctx.letterSpacing = '3px';
    const label = titleCase(event.category).toUpperCase();
    const pillW = ctx.measureText(label).width + 40;
    roundRect(ctx, W - PAD - pillW, 50, pillW, 40, 20);
    ctx.fillStyle = 'rgba(7,20,42,0.7)';
    ctx.fill();
    ctx.fillStyle = C.goldSoft;
    ctx.fillText(label, W - PAD - pillW + 20, 71);
  }
  ctx.letterSpacing = '0px';

  // Title.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.gold;
  ctx.font = `600 16px ${ui}`;
  ctx.letterSpacing = '5px';
  ctx.fillText('ADMIT ONE', PAD, 300);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = C.cream;
  ctx.font = `800 54px ${display}`;
  const titleLines = wrap(ctx, title, W - PAD * 2, 3);
  let y = 368;
  titleLines.forEach((line) => {
    ctx.fillText(line, PAD, y);
    y += 60;
  });

  // Detail grid.
  y += 24;
  const colW = (W - PAD * 2) / 2;
  const field = (label, value, x, top, width, lines = 1) => {
    ctx.fillStyle = C.gold;
    ctx.font = `600 14px ${ui}`;
    ctx.letterSpacing = '3px';
    ctx.fillText(label, x, top);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = C.cream;
    ctx.font = `600 26px ${sans}`;
    const rows = wrap(ctx, value, width - 24, lines);
    rows.forEach((row, i) => ctx.fillText(row, x, top + 38 + i * 32));
    return rows.length;
  };
  const start = event.startAt ? new Date(event.startAt) : null;
  field('DATE', start ? fmtDate(start, { weekday: 'short' }) : '–', PAD, y, colW);
  field('TIME', start ? `${fmtTime(start)}${event.endAt ? ` – ${fmtTime(event.endAt)}` : ''}` : '–', PAD + colW, y, colW);
  y += 100;
  const venueRows = field('VENUE', where(event), PAD, y, W - PAD * 2, 2);
  y += 68 + venueRows * 32;
  const kind = ticketType.kind === 'vip' ? 'VIP' : titleCase(ticketType.kind || '');
  field('TICKET', [ticketType.name, kind && kind !== ticketType.name ? `(${kind})` : ''].filter(Boolean).join(' ') || '–', PAD, y, colW);
  field('PRICE', money(ticketType.price, ticketType.currency), PAD + colW, y, colW);
  y += 100;
  field('HOLDER', holder || '–', PAD, y, colW);
  field('STATUS', titleCase(String(status).replace('-', ' ')), PAD + colW, y, colW);

  ctx.restore();

  // Gold frame.
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 39);
  ctx.strokeStyle = 'rgba(212,160,23,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Perforation with side notches, like a tear-off stub (drawn after the frame so they cut it).
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 40);
  ctx.clip();
  ctx.fillStyle = C.cream;
  [0, W].forEach((cx) => {
    ctx.beginPath();
    ctx.arc(cx, perfY, 26, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = 'rgba(250,248,242,0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(44, perfY);
  ctx.lineTo(W - 44, perfY);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR stub.
  const qrBox = 300;
  const boxX = PAD;
  const boxY = perfY + 50;
  roundRect(ctx, boxX, boxY, qrBox, qrBox, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  if (qr) ctx.drawImage(qr, boxX + 24, boxY + 24, qrBox - 48, qrBox - 48);

  const textX = boxX + qrBox + 40;
  const textW = W - textX - PAD;
  ctx.fillStyle = C.gold;
  ctx.font = `600 14px ${ui}`;
  ctx.letterSpacing = '3px';
  ctx.fillText('SCAN AT THE ENTRANCE', textX, boxY + 40);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = C.cream;
  ctx.font = `700 30px ${display}`;
  wrap(ctx, 'Valid for one entry', textW, 2).forEach((row, i) => ctx.fillText(row, textX, boxY + 90 + i * 36));
  ctx.fillStyle = C.muted;
  ctx.font = `400 19px ${sans}`;
  wrap(ctx, 'Present this ticket on your phone or printed. Each code can be checked in once.', textW, 3).forEach((row, i) =>
    ctx.fillText(row, textX, boxY + 150 + i * 28)
  );
  ctx.fillStyle = C.muted;
  ctx.font = `500 15px ui-monospace, Menlo, Consolas, monospace`;
  ctx.fillText('TICKET CODE', textX, boxY + 262);
  ctx.fillStyle = C.goldSoft;
  ctx.font = `600 17px ui-monospace, Menlo, Consolas, monospace`;
  const code = String(token || '');
  wrap(ctx, code.replace(/(.{24})/g, '$1 '), textW, 2).forEach((row, i) => ctx.fillText(row, textX, boxY + 288 + i * 22));
  ctx.restore();

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png'));
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
