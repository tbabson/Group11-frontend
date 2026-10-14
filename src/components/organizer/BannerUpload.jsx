'use client';

import { useState } from 'react';
import { Alert, Spinner } from '../UI';
import { api } from '@/lib/api';
import { bannerFor } from '@/lib/format';

export const BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TYPES = BANNER_TYPES;

// Same limits as the API: JPEG/PNG/WebP, 5 MB. Returns an error message or ''.
export function checkBannerFile(f) {
  if (!BANNER_TYPES.includes(f.type)) return 'Use a JPEG, PNG or WebP image.';
  if (f.size > 5 * 1024 * 1024) return 'The image must be 5 MB or smaller.';
  return '';
}

// Uploads a banner for an existing event.
export async function uploadBanner(eventId, file) {
  const body = new FormData();
  body.append('banner', file);
  return api(`/events/${eventId}/banner`, { method: 'POST', body });
}

export const bannerErrorMessage = (err) =>
  err?.status === 503 ? 'Banner uploads are not configured on the server (Cloudinary keys missing).' : err?.message || 'Banner upload failed';

export default function BannerUpload({ event, onUploaded }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) return;
    const problem = checkBannerFile(f);
    if (problem) return setError(problem);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    setBusy(true);
    setError('');
    try {
      await uploadBanner(event._id, file);
      setFile(null);
      setPreview(null);
      onUploaded();
    } catch (err) {
      setError(bannerErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card h-fit p-6">
      <h3 className="text-xl font-bold text-navy">Banner image</h3>
      <p className="mt-1 text-sm text-charcoal/55">Shown on cards and as your event page backdrop. A wide 16:9 photo works best.</p>
      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-navy/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview || bannerFor(event)} alt="Event banner preview" className="aspect-video w-full object-cover" />
      </div>
      {!event.bannerUrl && !preview && <p className="mt-2 text-xs text-charcoal/50">Showing a placeholder photo until you upload one.</p>}
      <div className="mt-4 space-y-3">
        <Alert>{error}</Alert>
        <label className="btn-ghost w-full cursor-pointer ring-1 ring-navy/10">
          Choose image
          <input type="file" accept={TYPES.join(',')} className="sr-only" onChange={pick} />
        </label>
        {file && (
          <button onClick={upload} className="btn-gold w-full" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Upload banner
          </button>
        )}
      </div>
    </div>
  );
}
