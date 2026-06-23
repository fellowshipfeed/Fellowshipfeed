'use client';

import { useState } from 'react';
import type { FeedGroup } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { GroupLabel } from './GroupChip';

type Props = {
  groups: FeedGroup[];
  onJoin: (groupId: string) => Promise<void>;
  onLeave: (groupId: string) => Promise<void>;
  onOpenGroup: (groupId: string) => void;
};

export function ExploreGroups({ groups, onJoin, onLeave, onOpenGroup }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'join' | 'leave' | null>(null);

  async function handleJoin(groupId: string) {
    setBusyId(groupId);
    setBusyAction('join');
    try {
      await onJoin(groupId);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleLeave(groupId: string) {
    setBusyId(groupId);
    setBusyAction('leave');
    try {
      await onLeave(groupId);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map(g => {
        const palette = getGroupStyleFromGroup(g);
        const memberLabel = `${g.member_count ?? 0} member${g.member_count === 1 ? '' : 's'}`;
        const isBusy = busyId === g.id;

        return (
          <article
            key={g.id}
            className="bg-white border border-line rounded-xl p-5 flex flex-col min-h-[168px] hover:border-ink-muted transition-colors"
            style={{ borderLeftWidth: 4, borderLeftColor: palette.hex }}
          >
            <GroupLabel
              group={g}
              size="md"
              className="font-display text-[17px] font-medium tracking-tight text-ink mb-1.5"
            />

            <p className="text-xs text-ink-muted mb-3">
              {memberLabel}
              {g.admin_name ? ` · ${g.admin_name}` : ''}
            </p>

            {g.description ? (
              <p className="text-[13px] text-ink-soft leading-relaxed flex-1 mb-5">{g.description}</p>
            ) : (
              <div className="flex-1 mb-5" />
            )}

            <div className="flex gap-2 mt-auto">
              {g.joined ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenGroup(g.id)}
                    className="flex-1 bg-accent text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-accent-hover"
                  >
                    Open group
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleLeave(g.id)}
                    className="px-3.5 py-2 rounded-md text-xs font-medium text-ink-soft border border-line hover:text-red-700 hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                  >
                    {isBusy && busyAction === 'leave' ? 'Leaving…' : 'Leave'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleJoin(g.id)}
                  className="w-full text-white text-[13px] font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: palette.hex }}
                >
                  {isBusy && busyAction === 'join' ? 'Joining…' : 'Join group'}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
