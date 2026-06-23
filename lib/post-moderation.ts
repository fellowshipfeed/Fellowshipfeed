import type { Session } from '@/lib/types';

export function canAutoApproveGroup(
  session: Pick<Session, 'primary_role' | 'admin_group_ids'>,
  groupId: string,
): boolean {
  if (session.primary_role === 'head' || session.primary_role === 'owner') return true;
  if (session.primary_role === 'group_admin') {
    return (session.admin_group_ids ?? []).includes(groupId);
  }
  return false;
}
