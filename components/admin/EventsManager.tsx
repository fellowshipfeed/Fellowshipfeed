'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { AdminEvent } from '@/lib/types';

type Group = { id: string; name: string };

type Props = {
  groups: Group[];
  events: AdminEvent[];
  orgId: string;
  currentUserId: string;
  onEventsChange: (events: AdminEvent[]) => void;
};

export function EventsManager({ groups, events, orgId, currentUserId, onEventsChange }: Props) {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [groupId, setGroupId] = useState<string>(groups[0]?.id ?? '');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function createEvent() {
    if (!title.trim() || !startsAt) return;
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .insert({
        org_id: orgId,
        group_id: groupId || null,
        title: title.trim(),
        description: description.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        location: location.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        created_by: currentUserId,
      })
      .select('id, title, description, starts_at, location, capacity, group_id, group:groups(name)')
      .single();

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    const group = Array.isArray(data.group) ? data.group[0] : data.group;
    const event: AdminEvent = {
      id: data.id,
      title: data.title,
      description: data.description,
      starts_at: data.starts_at,
      location: data.location,
      capacity: data.capacity,
      group_id: data.group_id,
      group_name: group?.name ?? null,
    };
    onEventsChange([event, ...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    setTitle('');
    setStartsAt('');
    setLocation('');
    setDescription('');
    setCapacity('');
    setMessage('Event created — it will appear on member feeds.');
  }

  async function deleteEvent(id: string) {
    if (!window.confirm('Delete this event?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }
    onEventsChange(events.filter(e => e.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="font-display text-lg font-medium mb-1">Create event</h2>
        <p className="text-sm text-ink-soft mb-4">
          Events you create here show in the Upcoming events strip for members in that group.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="text-xs text-ink-muted font-medium">Title</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Date night with childcare"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted font-medium">Date & time</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted font-medium">Group</span>
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">Parish-wide (all members)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted font-medium">Location</span>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Parish hall"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted font-medium">Capacity (optional)</span>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Unlimited"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-ink-muted font-medium">Description (optional)</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm resize-none"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={createEvent}
          disabled={saving || !title.trim() || !startsAt}
          className="mt-4 bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create event'}
        </button>
        {message && <p className="mt-3 text-sm text-ink-soft">{message}</p>}
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-line-soft font-medium text-sm">Upcoming events</div>
        {events.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-muted text-center">No events scheduled yet.</div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className="px-5 py-3 flex items-start gap-3 border-b border-line-soft last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {new Date(event.starts_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {event.location ? ` · ${event.location}` : ''}
                  {event.group_name ? ` · ${event.group_name}` : ' · Parish-wide'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteEvent(event.id)}
                className="text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
