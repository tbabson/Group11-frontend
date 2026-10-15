'use client';

import { useEffect, useState } from 'react';
import { BANNER_SIZE, BANNER_SIZE_LABEL, BANNER_TYPES, bannerSizeAdvice, checkBannerFile, readImageSize } from './BannerUpload';

// Chooses a banner image before the event exists. The create page uploads it right after
// the event is saved. `value` is a File or null. The API stores banners at 1080 × 608 (16:9);
// the preview uses that frame, so it shows exactly what will be kept.
export default function BannerPicker({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const [size, setSize] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) {
      setPreview(null);
      setSize(null);
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    let live = true;
    readImageSize(value).then((s) => live && setSize(s));
    return () => {
      live = false;
      URL.revokeObjectURL(url);
    };
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
          <img src={preview} alt="Selected banner preview" className="aspect-[1080/608] w-full object-cover" />
          <div className="flex flex-wrap items-center justify-between gap-3 bg-mist/50 px-4 py-3 text-sm">
            <span className="truncate text-charcoal/70">
              {value.name} · {size ? `${size.width} × ${size.height} px · ` : ''}
              {(value.size / 1024 / 1024).toFixed(1)} MB
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
        <label className="flex aspect-[1080/608] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/15 bg-mist/30 p-6 text-center transition hover:border-gold hover:bg-gold/5">
          <span className="font-ui text-sm font-semibold text-navy">Choose a banner image</span>
          <span className="text-xs text-charcoal/55">
            Recommended: <strong>{BANNER_SIZE_LABEL}</strong>
          </span>
          <span className="text-xs text-charcoal/55">JPEG, PNG or WebP · up to 5 MB</span>
          <input type="file" accept={BANNER_TYPES.join(',')} className="sr-only" onChange={pick} />
        </label>
      )}
      {error ? (
        <span className="mt-1 block text-sm text-rose-600">{error}</span>
      ) : size && bannerSizeAdvice(size) ? (
        <span className="mt-1 block text-xs text-amber-700">{bannerSizeAdvice(size)}</span>
      ) : (
        <span className="mt-1 block text-xs text-charcoal/50">
          Saved at {BANNER_SIZE.width} × {BANNER_SIZE.height} px and shown on event cards and as your event page backdrop. You can change it later.
        </span>
      )}
    </div>
  );
}
