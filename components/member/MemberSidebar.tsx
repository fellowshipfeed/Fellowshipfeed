'use client';

import type { FeedGroup, OrgResource } from '@/lib/types';
import { getGroupStyle } from '@/lib/group-styles';

export type FeedView = 'home' | 'group' | 'pending';

type Props = {
  groups: FeedGroup[];
  resources: OrgResource[];
  activeView: FeedView;
  activeGroupId: string | null;
  pendingCount: number;
  onViewChange: (view: FeedView, groupId?: string | null) => void;
};

export function MemberSidebar({
  groups,
  resources,
  activeView,
  activeGroupId,
  pendingCount,
  onViewChange,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-[84px] lg:self-start space-y-3.5">
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
          My Groups
        </div>
        <button
          type="button"
          onClick={() => onViewChange('home')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
            activeView === 'home'
              ? 'bg-accent-soft text-accent border-accent font-medium'
              : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l6-5 6 5v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          My Feed
        </button>
        {groups.map(g => {
          const style = getGroupStyle(g.slug);
          const active = activeView === 'group' && activeGroupId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onViewChange('group', g.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
                active
                  ? 'bg-accent-soft text-accent border-accent font-medium'
                  : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
              {g.name}
            </button>
          );
        })}
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 8h12" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className="flex-1 text-left">{r.label}</span>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="opacity-50" aria-hidden="true">
                <path d="M6 4h6v6M12 4l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
          Your activity
        </div>
        <button
          type="button"
          onClick={() => onViewChange('pending')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
            activeView === 'pending'
              ? 'bg-accent-soft text-accent border-accent font-medium'
              : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Posts Pending Review</span>
          {pendingCount > 0 && (
            <span className="bg-pending text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
