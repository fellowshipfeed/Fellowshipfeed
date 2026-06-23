import type { FeedGroup, Session } from '@/lib/types';

export function buildSidebarGroups(
  memberGroups: FeedGroup[],
  allGroups: FeedGroup[],
  session: Pick<Session, 'primary_role' | 'admin_group_ids'>,
): FeedGroup[] {
  const adminGroupIds = new Set(session.admin_group_ids ?? []);
  const map = new Map<string, FeedGroup>(memberGroups.map(g => [g.id, { ...g, joined: true }]));

  for (const g of allGroups) {
    if (adminGroupIds.has(g.id) && !map.has(g.id)) {
      map.set(g.id, { ...g, joined: false });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAdminBadgeIds(
  _sidebarGroups: FeedGroup[],
  session: Pick<Session, 'admin_group_ids'>,
): Set<string> {
  return new Set(session.admin_group_ids ?? []);
}
