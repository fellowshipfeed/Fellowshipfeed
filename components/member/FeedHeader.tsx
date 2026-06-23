import type { ReactNode } from 'react';
import type { FeedGroup } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { GroupDot } from './GroupDot';

type HeaderVariant = 'group' | 'pending' | 'yourPosts' | 'saved' | 'explore';

type Props = {
  variant: HeaderVariant;
  group?: FeedGroup | null;
  onLeaveGroup?: () => void;
  onAskAdmin?: () => void;
};

const icons: Record<Exclude<HeaderVariant, 'group'>, { bg: string; content: ReactNode }> = {
  pending: {
    bg: 'bg-pending-soft text-pending',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  yourPosts: {
    bg: 'bg-accent-soft text-accent',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  saved: {
    bg: 'bg-[#FFF6E0] text-pending',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 2h8v12l-4-3-4 3V2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  explore: {
    bg: 'bg-accent-soft text-accent',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
};

const copy: Record<HeaderVariant, { title: string; meta: string }> = {
  group: { title: '', meta: '' },
  pending: { title: 'Posts Pending Review', meta: 'Your posts awaiting admin approval' },
  yourPosts: { title: 'Your posts', meta: "Everything you've shared" },
  saved: { title: 'Saved posts', meta: 'Posts you bookmarked for later' },
  explore: { title: 'Explore groups', meta: 'Browse ministries and join the ones that fit you' },
};

export function FeedHeader({ variant, group, onLeaveGroup, onAskAdmin }: Props) {
  if (variant === 'group' && group) {
    const palette = getGroupStyleFromGroup(group);
    return (
      <div
        className="bg-white border border-line rounded-xl p-5 sm:p-6 mb-4 flex gap-4 items-center"
        style={{ borderLeftWidth: 4, borderLeftColor: palette.hex }}
      >
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[22px] font-medium tracking-tight flex items-center gap-2">
            <GroupDot slug={group.slug} color={group.color} size="md" />
            {group.name}
          </h1>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-3">
            <span>{group.member_count ?? 0} members</span>
            {group.admin_name && (
              <>
                <span className="text-line">·</span>
                <span>Admin: {group.admin_name}</span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onAskAdmin}
          className="flex items-center gap-1.5 bg-cream-soft border border-line px-3.5 py-2 rounded-md text-xs font-medium text-ink hover:bg-line-soft shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M2 4a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H5l-2 2v-2H3a1 1 0 01-1-1V4z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          Ask admin
        </button>
        {onLeaveGroup && (
          <button
            type="button"
            onClick={onLeaveGroup}
            className="hidden sm:flex items-center gap-1.5 bg-white border border-line px-3.5 py-2 rounded-md text-xs font-medium text-ink-soft hover:text-red-700 hover:border-red-300 hover:bg-red-50"
          >
            Leave group
          </button>
        )}
      </div>
    );
  }

  const icon = icons[variant as Exclude<HeaderVariant, 'group'>];
  const text = copy[variant];

  return (
    <div className="bg-white border border-line rounded-xl p-5 sm:p-6 mb-4 flex gap-4 items-center">
      <div
        className={`w-[52px] h-[52px] rounded-[10px] flex items-center justify-center shrink-0 ${icon.bg}`}
      >
        {icon.content}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-[22px] font-medium tracking-tight">{text.title}</h1>
        <p className="text-xs text-ink-muted mt-1">{text.meta}</p>
      </div>
    </div>
  );
}
