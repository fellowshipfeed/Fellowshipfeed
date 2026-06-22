'use client';

import type { FeedGroup } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { getInitials } from '@/lib/format';
import { GroupLabel } from './GroupChip';

type Props = {
  groups: FeedGroup[];
  onJoin: (groupId: string) => Promise<void>;
  onOpenGroup: (groupId: string) => void;
};

export function ExploreGroups({ groups, onJoin, onOpenGroup }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {groups.map(g => {
        const palette = getGroupStyleFromGroup(g);
        return (
          <div
            key={g.id}
            className="bg-white border border-line rounded-xl p-[18px] flex flex-col hover:border-ink-muted transition-colors"
          >
            <div
              className={`w-11 h-11 rounded-[10px] flex items-center justify-center font-display text-lg font-medium mb-3 ${palette.icon}`}
            >
              {getInitials(g.name, 2)}
            </div>
            <GroupLabel group={g} className="font-display font-medium text-[17px] tracking-tight mb-1 text-ink" />
            <div className="text-xs text-ink-muted mb-2.5">
              {g.member_count ?? 0} members
            </div>
            {g.description && (
              <p className="text-[13px] text-ink-soft leading-relaxed mb-3.5 flex-1">{g.description}</p>
            )}
            <div className="flex gap-2 mt-auto">
              {g.joined ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenGroup(g.id)}
                    className="flex-1 bg-accent text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-accent-hover"
                  >
                    ✓ Joined — open
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onJoin(g.id)}
                  className="flex-1 bg-accent text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-accent-hover"
                >
                  Join group
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
