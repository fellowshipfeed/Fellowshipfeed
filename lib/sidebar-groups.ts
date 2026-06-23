import type { FeedGroup, Session } from '@/lib/types';

export function buildSidebarGroups(
  memberGroups: FeedGroup[],
  allGroups: FeedGroup[],
  session: Pick<Session, 'primary_role' | 'admin_group_ids'>,
): FeedGroup[] {
  const isHeadOrOwner = session.primary_role === 'head' || session.primary_role === 'owner';
  const adminGroupIds = new Set(session.admin_group_ids ?? []);
  const map = new Map<string, FeedGroup>(memberGroups.map(g => [g.id, { ...g, joined: true }]));

  if (isHeadOrOwner) {
    for (const g of allGroups) {
      if (!map.has(g.id)) map.set(g.id, { ...g, joined: false });
    }
  } else if (session.primary_role === 'group_admin') {
    for (const g of allGroups) {
      if (adminGroupIds.has(g.id) && !map.has(g.id)) {
        map.set(g.id, { ...g, joined: false });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAdminBadgeIds(
  sidebarGroups: FeedGroup[],
  session: Pick<Session, 'primary_role' | 'admin_group_ids'>,
): Set<string> {
  const isHeadOrOwner = session.primary_role === 'head' || session.primary_role === 'owner';
  if (isHeadOrOwner) {
    return new Set(sidebarGroups.map(g => g.id));
  }
  return new Set(session.admin_group_ids ?? []);
}
