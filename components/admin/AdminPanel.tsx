'use client';

import { useState } from 'react';
import { ApprovalQueue } from './ApprovalQueue';
import { EventsManager } from './EventsManager';
import { CalendarSettings } from './CalendarSettings';
import type { AdminEvent, OrgCalendarSettings, PendingPost } from '@/lib/types';

type AdminGroup = { id: string; name: string };

type Props = {
  pending: PendingPost[];
  groups: AdminGroup[];
  events: AdminEvent[];
  calendar: OrgCalendarSettings;
  currentUserId: string;
  orgId: string;
  canManageCalendar: boolean;
};

type Tab = 'approvals' | 'events' | 'calendar';

export function AdminPanel({
  pending,
  groups,
  events: initialEvents,
  calendar,
  currentUserId,
  orgId,
  canManageCalendar,
}: Props) {
  const [tab, setTab] = useState<Tab>('approvals');
  const [events, setEvents] = useState(initialEvents);

  const tabs: { id: Tab; label: string; show?: boolean }[] = [
    { id: 'approvals', label: `Approvals${pending.length ? ` (${pending.length})` : ''}` },
    { id: 'events', label: 'Events' },
    { id: 'calendar', label: 'Calendar', show: canManageCalendar },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5 border-b border-line pb-3">
        {tabs
          .filter(t => t.show !== false)
          .map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-accent text-white'
                  : 'text-ink-soft hover:bg-cream-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'approvals' && (
        <ApprovalQueue initialPending={pending} currentUserId={currentUserId} />
      )}
      {tab === 'events' && (
        <EventsManager
          groups={groups}
          events={events}
          orgId={orgId}
          currentUserId={currentUserId}
          onEventsChange={setEvents}
        />
      )}
      {tab === 'calendar' && canManageCalendar && (
        <CalendarSettings orgId={orgId} initial={calendar} />
      )}
    </div>
  );
}
