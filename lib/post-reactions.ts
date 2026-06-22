import type { PostReactions } from '@/lib/types';

export const EMPTY_REACTIONS: PostReactions = { heart: 0, pray: 0, in: 0, amen: 0 };

export function totalReactions(reactions: PostReactions): number {
  return reactions.heart + reactions.pray + reactions.in + reactions.amen;
}

export function aggregateReactions(
  rows: { post_id: string; kind: string; user_id: string }[],
  currentUserId: string,
): Map<string, { reactions: PostReactions; my_reactions: string[] }> {
  const map = new Map<string, { reactions: PostReactions; my_reactions: string[] }>();

  for (const row of rows) {
    let entry = map.get(row.post_id);
    if (!entry) {
      entry = { reactions: { ...EMPTY_REACTIONS }, my_reactions: [] };
      map.set(row.post_id, entry);
    }
    const kind = row.kind as keyof PostReactions;
    if (kind in entry.reactions) {
      entry.reactions[kind] += 1;
    }
    if (row.user_id === currentUserId && !entry.my_reactions.includes(row.kind)) {
      entry.my_reactions.push(row.kind);
    }
  }

  return map;
}
