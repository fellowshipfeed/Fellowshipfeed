'use client';

import type { AdminView, FeedGroup, OrgResource } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { GroupDot } from '@/components/member/GroupDot';

type Props = {
  groups: FeedGroup[];
  resources: OrgResource[];
  activeView: AdminView;
  pendingCount: number;
  unreadMessageCount: number;
  canManageCalendar: boolean;
  onViewChange: (view: AdminView) => void;
};

function ResourceIcon({ resourceKey }: { resourceKey: string }) {
  if (resourceKey === 'online_giving') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 14s-5-3-5-7a3 3 0 016-1 3 3 0 016 1c0 4-5 7-5 7H8z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function AdminSidebar({
  groups,
  resources,
  activeView,
  pendingCount,
  unreadMessageCount,
  canManageCalendar,
  onViewChange,
}: Props) {
  const navClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
      active
        ? 'bg-accent-soft text-accent border-accent font-medium'
        : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
    }`;

  return (
    <aside className="lg:sticky lg:top-[84px] lg:self-start space-y-3.5">
      {groups.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
            Groups you manage
          </div>
          {groups.map(g => {
            const palette = getGroupStyleFromGroup(g);
            return (
              <div
                key={g.id}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-soft border-l-[3px] border-transparent"
              >
                <GroupDot slug={g.slug} color={g.color} size="md" />
                <span className="flex-1 text-left truncate">{g.name}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: palette.soft, color: palette.hex }}
                >
                  Admin
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
          Admin
        </div>
        <button type="button" onClick={() => onViewChange('approvals')} className={navClass(activeView === 'approvals')}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8l3 3 7-7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="flex-1 text-left">Approvals</span>
          {pendingCount > 0 && (
            <span className="bg-pending text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => onViewChange('events')} className={navClass(activeView === 'events')}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Events</span>
        </button>
        {canManageCalendar && (
          <button
            type="button"
            onClick={() => onViewChange('calendar')}
            className={navClass(activeView === 'calendar')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="flex-1 text-left">Parish calendar</span>
          </button>
        )}
        <button type="button" onClick={() => onViewChange('messages')} className={navClass(activeView === 'messages')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M2 4a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H5l-2 2v-2H3a1 1 0 01-1-1V4z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <span className="flex-1 text-left">Messages</span>
          {unreadMessageCount > 0 && (
            <span className="bg-pending text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {unreadMessageCount}
            </span>
          )}
        </button>
      </div>

      {resources.length > 0 && (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
            Church Resources
          </div>
          {resources.map(r => (
            <a
              key={r.key}
              href={r.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-soft hover:bg-cream-soft hover:text-ink border-l-[3px] border-transparent"
            >
              <ResourceIcon resourceKey={r.key} />
              <span className="flex-1 text-left">{r.label}</span>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="opacity-50" aria-hidden="true">
                <path
                  d="M6 4h6v6M12 4l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
