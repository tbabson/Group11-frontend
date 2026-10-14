'use client';

import { useEffect, useState } from 'react';
import { BANNER_TYPES, checkBannerFile } from './BannerUpload';

// Chooses a banner image before the event exists. The create page uploads it right after
// the event is saved. `value` is a File or null.
export default function BannerPicker({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) return setPreview(null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again after removing it
    if (!f) return;
    const problem = checkBannerFile(f);
    setError(problem);
    if (!problem) onChange(f);
  };

  return (
    <div>
      <span className="label">Banner image (optional)</span>
      {preview ? (
        <div className="overflow-hidden rounded-2xl ring-1 ring-navy/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected banner preview" className="aspect-video w-full object-cover" />
          <div className="flex flex-wrap items-center justify-between gap-3 bg-mist/50 px-4 py-3 text-sm">
            <span className="truncate text-charcoal/70">
              {value.name} · {(value.size / 1024 / 1024).toFixed(1)} MB
            </span>
            <div className="flex gap-2">
              <label className="btn-ghost cursor-pointer !px-3 !py-1.5 ring-1 ring-navy/10">
                Change
                <input type="file" accept={BANNER_TYPES.join(',')} className="sr-only" onChange={pick} />
              </label>
              <button type="button" className="btn-ghost !px-3 !py-1.5 text-rose-600" onClick={() => onChange(null)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex aspect-[16/6] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/15 bg-mist/30 p-6 text-center transition hover:border-gold hover:bg-gold/5">
          <span className="font-ui text-sm font-semibold text-navy">Choose a banner image</span>
          <span className="text-xs text-charcoal/55">JPEG, PNG or WebP · up to 5 MB · a wide 16:9 photo works best</span>
          <input type="file" accept={BANNER_TYPES.join(',')} className="sr-only" onChange={pick} />
        </label>
      )}
      {error ? (
        <span className="mt-1 block text-sm text-rose-600">{error}</span>
      ) : (
        <span className="mt-1 block text-xs text-charcoal/50">Shown on event cards and as your event page backdrop. You can change it later.</span>
      )}
    </div>
  );
}
