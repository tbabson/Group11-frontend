// Thin client for the Express API. Requests go to /api/v1 on this origin and are
// proxied to the backend by next.config.mjs.
const BASE = '/api/v1';
const STORAGE_KEY = 'g11.session';

export class ApiError extends Error {
  constructor(status, { code, message, details } = {}) {
    super(message || 'Something went wrong');
    this.status = status;
    this.code = code || 'UNKNOWN';
    this.details = details || [];
  }
}

// ---- session storage ----
export function loadSession() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

const listeners = new Set();
export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function saveSession(session) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the session simply won't survive a reload.
  }
  listeners.forEach((fn) => fn(session));
}

// ---- refresh ----
// Refresh tokens rotate on every use, so concurrent 401s must share one refresh call.
let refreshing = null;
async function refreshSession() {
  const current = loadSession();
  if (!current?.refreshToken) return null;
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh failed');
        const { data } = await res.json();
        saveSession(data);
        return data;
      })
      .catch(() => {
        saveSession(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// True when the JWT access token expires within the next 30 seconds.
function expiringSoon(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return exp * 1000 < Date.now() + 30000;
  } catch {
    return false;
  }
}

function buildUrl(path, query) {
  const url = `${BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function raw(path, { method = 'GET', body, query, auth = true, retry = true } = {}) {
  let session = auth ? loadSession() : null;
  // Refresh up front: some public routes (GET /events/:slug) ignore an expired token instead
  // of returning 401, which would hide an organizer's own drafts.
  if (session?.accessToken && session.refreshToken && expiringSoon(session.accessToken)) {
    session = (await refreshSession()) || null;
  }
  const headers = {};
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: 'Cannot reach the server. Is the API running?' });
  }

  if (res.status === 401 && retry && session?.refreshToken) {
    const fresh = await refreshSession();
    if (fresh) return raw(path, { method, body, query, auth, retry: false });
  }
  return res;
}

// Returns { data, meta } or throws ApiError.
export async function api(path, options) {
  const res = await raw(path, options);
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page).
  }
  if (!res.ok || !json?.success) {
    const fallback = res.status >= 500 ? 'The server had a problem. Please try again.' : 'Request failed';
    throw new ApiError(res.status, json?.error || { message: fallback });
  }
  return { data: json.data, meta: json.meta, status: res.status };
}

// For file downloads that need the bearer token (CSV export, ticket QR image).
export async function apiBlob(path, options) {
  const res = await raw(path, options);
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.error);
  }
  return res.blob();
}

// Fetches an authenticated file and saves it to the user's device.
export async function downloadFile(path, filename, options) {
  const blob = await apiBlob(path, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Turns validation details into { field: message } for forms.
export function fieldErrors(err) {
  const out = {};
  (err?.details || []).forEach((d) => {
    const key = Array.isArray(d.path) ? d.path.join('.') : d.field || d.path;
    if (key && !out[key]) out[key] = d.message;
  });
  return out;
}
