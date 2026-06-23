'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ParishLinks } from '@/lib/types';

type Props = {
  orgId: string;
  resourceIds: { parish_website: string; online_giving: string };
  initial: ParishLinks;
};

export function ParishLinksSettings({ orgId, resourceIds, initial }: Props) {
  const [websiteUrl, setWebsiteUrl] = useState(initial.parish_website_url ?? '');
  const [givingUrl, setGivingUrl] = useState(initial.online_giving_url ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    setSaving(true);
    setMessage('');
    const supabase = createClient();

    const updates = [
      {
        org_id: orgId,
        resource_id: resourceIds.parish_website,
        url: websiteUrl.trim() || null,
        enabled: true,
      },
      {
        org_id: orgId,
        resource_id: resourceIds.online_giving,
        url: givingUrl.trim() || null,
        enabled: true,
      },
    ];

    const { error } = await supabase.from('org_resources').upsert(updates, {
      onConflict: 'org_id,resource_id',
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Parish links saved. Members will see them in the sidebar.');
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-medium mb-1">Parish links</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Parish website and online giving appear for every member in the feed sidebar. Set the URLs once here
          at the parish level.
        </p>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Parish website</span>
        <input
          type="url"
          value={websiteUrl}
          onChange={e => setWebsiteUrl(e.target.value)}
          placeholder="https://yourparish.org"
          className="mt-1.5 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Online giving</span>
        <input
          type="url"
          value={givingUrl}
          onChange={e => setGivingUrl(e.target.value)}
          placeholder="https://yourparish.org/give"
          className="mt-1.5 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-ink-muted mt-1 block">
          Tithe.ly, Pushpay, or your parish giving page.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save parish links'}
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
