'use client';

import { useMemo, useState } from 'react';
import type {
  AdminEvent,
  AdminMessage,
  AdminView,
  FeedGroup,
  OrgCalendarSettings,
  OrgResource,
  PendingPost,
  Session,
} from '@/lib/types';
import { MemberTopBar } from '@/components/member/MemberTopBar';
import { AdminSidebar } from './AdminSidebar';
import { AdminFeedHeader } from './AdminFeedHeader';
import { ApprovalQueue } from './ApprovalQueue';
import { EventsManager } from './EventsManager';
import { CalendarSettings } from './CalendarSettings';
import { AdminMessagesPanel } from './AdminMessagesPanel';

type Props = {
  session: Session;
  orgCity: string | null;
  groups: FeedGroup[];
  resources: OrgResource[];
  pending: PendingPost[];
  events: AdminEvent[];
  calendar: OrgCalendarSettings;
  messages: AdminMessage[];
  canManageCalendar: boolean;
};

export function AdminPortal({
  session,
  orgCity,
  groups,
  resources,
  pending: initialPending,
  events: initialEvents,
  calendar,
  messages: initialMessages,
  canManageCalendar,
}: Props) {
  const [view, setView] = useState<AdminView>(
    initialPending.length > 0 ? 'approvals' : initialMessages.some(m => !m.read_at) ? 'messages' : 'approvals',
  );
  const [pending, setPending] = useState(initialPending);
  const [events, setEvents] = useState(initialEvents);
  const [messages, setMessages] = useState(initialMessages);

  const unreadMessageCount = useMemo(() => messages.filter(m => !m.read_at).length, [messages]);

  const adminGroups = groups.filter(g =>
    session.primary_role === 'head' || session.primary_role === 'owner'
      ? true
      : (session.admin_group_ids ?? []).includes(g.id),
  );

  return (
    <div className="min-h-screen bg-cream">
      <MemberTopBar
        orgName={session.org_name}
        orgCity={orgCity}
        userName={session.name}
        userInitials={session.initials}
        mode="admin"
        unreadCount={unreadMessageCount}
        recentMessages={[...messages]
          .sort((a, b) => {
            if (Boolean(a.read_at) !== Boolean(b.read_at)) return a.read_at ? 1 : -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, 5)}
        onOpenMessages={() => setView('messages')}
      />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <AdminSidebar
          groups={adminGroups}
          resources={resources}
          activeView={view}
          pendingCount={pending.length}
          unreadMessageCount={unreadMessageCount}
          canManageCalendar={canManageCalendar}
          onViewChange={setView}
        />

        <main className="min-w-0">
          {pending.length > 0 && view !== 'approvals' && (
            <div className="bg-pending-soft border border-pending rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-[13px]">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-pending shrink-0" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="flex-1 text-ink">
                <strong className="text-pending font-semibold">
                  {pending.length} post{pending.length === 1 ? '' : 's'}
                </strong>{' '}
                waiting for your review.
              </span>
              <button
                type="button"
                onClick={() => setView('approvals')}
                className="text-pending text-xs font-medium underline"
              >
                Review now
              </button>
            </div>
          )}

          {unreadMessageCount > 0 && view !== 'messages' && (
            <div className="bg-accent-soft border border-accent/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-[13px]">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-accent shrink-0" aria-hidden="true">
                <path
                  d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="flex-1 text-ink">
                <strong className="text-accent font-semibold">
                  {unreadMessageCount} new message{unreadMessageCount === 1 ? '' : 's'}
                </strong>{' '}
                from members.
              </span>
              <button
                type="button"
                onClick={() => setView('messages')}
                className="text-accent text-xs font-medium underline"
              >
                Read messages
              </button>
            </div>
          )}

          <AdminFeedHeader view={view} />

          {view === 'approvals' && (
            <ApprovalQueue
              initialPending={pending}
              currentUserId={session.user_id}
              onPendingChange={setPending}
            />
          )}
          {view === 'events' && (
            <EventsManager
              groups={adminGroups.map(g => ({ id: g.id, name: g.name }))}
              events={events}
              orgId={session.org_id}
              currentUserId={session.user_id}
              onEventsChange={setEvents}
            />
          )}
          {view === 'calendar' && canManageCalendar && (
            <CalendarSettings orgId={session.org_id} initial={calendar} />
          )}
          {view === 'messages' && (
            <AdminMessagesPanel
              messages={messages}
              currentUserId={session.user_id}
              onMessagesChange={setMessages}
            />
          )}
        </main>
      </div>
    </div>
  );
}
