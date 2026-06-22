'use client';

import type { FeedGroup, OrgResource } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { GroupDot } from './GroupDot';

export type FeedView = 'home' | 'group' | 'pending' | 'yourPosts' | 'saved' | 'explore';

type Props = {
  groups: FeedGroup[];
  resources: OrgResource[];
  activeView: FeedView;
  activeGroupId: string | null;
  pendingCount: number;
  savedCount: number;
  onViewChange: (view: FeedView, groupId?: string | null) => void;
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

export function MemberSidebar({
  groups,
  resources,
  activeView,
  activeGroupId,
  pendingCount,
  savedCount,
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
            <path
              d="M2 8l6-5 6 5v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          My Feed
        </button>
        {groups.map(g => {
          const palette = getGroupStyleFromGroup(g);
          const active = activeView === 'group' && activeGroupId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onViewChange('group', g.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
                active ? 'font-medium' : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
              }`}
              style={
                active
                  ? {
                      backgroundColor: palette.soft,
                      color: palette.hex,
                      borderLeftColor: palette.hex,
                    }
                  : undefined
              }
            >
              <GroupDot slug={g.slug} color={g.color} size="md" />
              {g.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onViewChange('explore')}
          className={`mx-3 mb-3 mt-2 p-3 border border-dashed rounded-md flex items-center gap-2.5 text-left transition-colors ${
            activeView === 'explore'
              ? 'border-accent bg-accent-soft'
              : 'border-line bg-cream-soft hover:border-accent hover:bg-accent-soft'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-white border border-line flex items-center justify-center text-ink-soft shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-xs font-medium text-ink leading-snug">
            Explore groups
            <span className="block text-[11px] text-ink-muted font-normal mt-0.5">Explore other ministries</span>
          </span>
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
        <button
          type="button"
          onClick={() => onViewChange('yourPosts')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
            activeView === 'yourPosts'
              ? 'bg-accent-soft text-accent border-accent font-medium'
              : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Your Posts</span>
        </button>
        <button
          type="button"
          onClick={() => onViewChange('saved')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
            activeView === 'saved'
              ? 'bg-accent-soft text-accent border-accent font-medium'
              : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 2h8v12l-4-3-4 3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span className="flex-1 text-left">Saved posts</span>
          {savedCount > 0 && (
            <span className="bg-ink-soft text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
