'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { OrgCalendarSettings } from '@/lib/types';

type Props = {
  orgId: string;
  initial: OrgCalendarSettings;
};

export function CalendarSettings({ orgId, initial }: Props) {
  const [googleUrl, setGoogleUrl] = useState(initial.google_calendar_url ?? '');
  const [icsUrl, setIcsUrl] = useState(initial.calendar_ics_url ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase
      .from('orgs')
      .update({
        google_calendar_url: googleUrl.trim() || null,
        calendar_ics_url: icsUrl.trim() || null,
      })
      .eq('id', orgId);
    setSaving(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Calendar settings saved. Members can subscribe from their feed.');
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-medium mb-1">Parish calendar</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Connect your Google Calendar or an ICS feed. Members see an &ldquo;Add to my calendar&rdquo; option on
          their feed — events you create below still appear separately.
        </p>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
          Google Calendar URL
        </span>
        <input
          type="url"
          value={googleUrl}
          onChange={e => setGoogleUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/embed?src=..."
          className="mt-1.5 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-ink-muted mt-1 block">
          Paste your public Google Calendar link or embed URL from Calendar → Settings → Integrate calendar.
        </span>
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
          ICS / Webcal feed (optional)
        </span>
        <input
          type="url"
          value={icsUrl}
          onChange={e => setIcsUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
          className="mt-1.5 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-ink-muted mt-1 block">
          ICS link for Apple Calendar, Outlook, and other apps.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save calendar settings'}
        </button>
        {message && (
          <span className={`text-sm ${message.includes('saved') ? 'text-success' : 'text-red-700'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
