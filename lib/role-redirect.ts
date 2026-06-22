import type { PrimaryRole } from '@/lib/types';

export function getRolePath(role: PrimaryRole): string {
  switch (role) {
    case 'owner':
      return '/console';
    case 'head':
      return '/head';
    case 'group_admin':
      return '/admin';
    case 'member':
      return '/feed';
    default:
      return '/feed';
  }
}
