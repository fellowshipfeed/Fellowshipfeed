'use client';

import Link from 'next/link';
import type { FeedGroup } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { GroupDot } from './GroupDot';

type MemberModeProps = {
  mode: 'member';
  groups: FeedGroup[];
  activeGroupId: string | null;
  activeHome: boolean;
  activeExplore: boolean;
  adminGroupIds?: Set<string>;
  onMyFeed: () => void;
  onGroup: (groupId: string) => void;
  onExplore: () => void;
};

type LinkModeProps = {
  mode: 'link';
  groups: FeedGroup[];
  adminGroupIds?: Set<string>;
};

type Props = MemberModeProps | LinkModeProps;

function AdminBadge({ group, adminGroupIds }: { group: FeedGroup; adminGroupIds?: Set<string> }) {
  if (!adminGroupIds?.has(group.id)) return null;
  const palette = getGroupStyleFromGroup(group);
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
      style={{ backgroundColor: palette.soft, color: palette.hex }}
    >
      Admin
    </span>
  );
}

export function GroupsNavCard(props: Props) {
  const { groups, adminGroupIds } = props;

  const groupRowClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors no-underline cursor-pointer ${
      active ? 'font-medium' : 'text-ink-soft border-transparent hover:bg-cream-soft hover:text-ink'
    }`;

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.09em] text-ink-muted font-semibold px-4 pt-3.5 pb-2">
        My Groups
      </div>

      {props.mode === 'link' ? (
        <Link href="/feed" className={`${groupRowClass(false)} border-transparent`}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 8l6-5 6 5v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          My Feed
        </Link>
      ) : (
        <button
          type="button"
          onClick={props.onMyFeed}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors ${
            props.activeHome
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
      )}

      {groups.map(g => {
        const palette = getGroupStyleFromGroup(g);
        const active = props.mode === 'member' && props.activeGroupId === g.id;

        if (props.mode === 'link') {
          return (
            <Link
              key={g.id}
              href={`/feed/group/${g.id}`}
              className={groupRowClass(false)}
            >
              <GroupDot slug={g.slug} color={g.color} size="md" />
              <span className="flex-1 truncate text-left">{g.name}</span>
              <AdminBadge group={g} adminGroupIds={adminGroupIds} />
            </Link>
          );
        }

        return (
          <button
            key={g.id}
            type="button"
            onClick={() => props.onGroup(g.id)}
            className={groupRowClass(active)}
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
            <GroupDot slug={g.slug} color={g.color} size="md" inverted={active} />
            <span className="flex-1 text-left truncate">{g.name}</span>
            <AdminBadge group={g} adminGroupIds={adminGroupIds} />
          </button>
        );
      })}

      <div className="px-3 pb-3 pt-2">
        {props.mode === 'link' ? (
          <Link
            href="/feed?view=explore"
            className="w-full p-3 border border-dashed rounded-md flex items-center gap-2.5 text-left transition-colors border-line bg-cream-soft hover:border-accent hover:bg-accent-soft no-underline cursor-pointer"
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
          </Link>
        ) : (
          <button
            type="button"
            onClick={props.onExplore}
            className={`w-full p-3 border border-dashed rounded-md flex items-center gap-2.5 text-left transition-colors ${
              props.activeExplore
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
        )}
      </div>
    </div>
  );
}
