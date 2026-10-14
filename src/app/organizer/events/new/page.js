'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/EventForm';
import RequireRole from '@/components/RequireRole';
import BannerPicker from '@/components/organizer/BannerPicker';
import { bannerErrorMessage, uploadBanner } from '@/components/organizer/BannerUpload';
import { PageHeader } from '@/components/UI';
import { Reveal } from '@/components/Motion';
import { api } from '@/lib/api';

export default function NewEventPage() {
  return (
    <RequireRole roles={['organizer', 'admin']}>
      <NewEvent />
    </RequireRole>
  );
}

function NewEvent() {
  const router = useRouter();
  const [banner, setBanner] = useState(null);

  const create = async (body) => {
    const { data } = await api('/events', { method: 'POST', body });
    const next = new URLSearchParams({ tab: 'tickets', created: '1' });
    if (banner) {
      try {
        await uploadBanner(data._id, banner);
      } catch (err) {
        // The event exists either way; the manage page explains and offers a retry on the Details tab.
        next.set('bannerError', bannerErrorMessage(err));
      }
    }
    router.push(`/organizer/events/${data.slug}?${next}`);
  };

  return (
    <>
      <PageHeader eyebrow="New event" title="Create an event" subtitle="It starts as a draft. Add ticket tiers next, then publish." />
      <section className="py-12">
        <Reveal className="container-x">
          <div className="card mx-auto max-w-4xl p-6 sm:p-10">
            <EventForm submitLabel="Create draft" onSubmit={create}>
              <BannerPicker value={banner} onChange={setBanner} />
            </EventForm>
          </div>
        </Reveal>
      </section>
    </>
  );
}
