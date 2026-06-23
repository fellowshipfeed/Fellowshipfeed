import type { FeedView } from '@/components/member/MemberSidebar';

export function feedUrlForView(view: FeedView, groupId?: string | null): string {
  if (view === 'explore') return '/feed?view=explore';
  if (view === 'pending') return '/feed?view=pending';
  if (view === 'yourPosts') return '/feed?view=your-posts';
  if (view === 'saved') return '/feed?view=saved';
  if (view === 'group' && groupId) return `/feed?group=${groupId}`;
  return '/feed';
}

export function parseFeedUrl(search: string): { view: FeedView; groupId: string | null } {
  const params = new URLSearchParams(search);
  const viewParam = params.get('view');
  if (viewParam === 'explore') return { view: 'explore', groupId: null };
  if (viewParam === 'pending') return { view: 'pending', groupId: null };
  if (viewParam === 'your-posts') return { view: 'yourPosts', groupId: null };
  if (viewParam === 'saved') return { view: 'saved', groupId: null };

  const groupId = params.get('group');
  if (groupId) return { view: 'group', groupId };

  return { view: 'home', groupId: null };
}

export function sortPostsByDate<T extends { created_at: string }>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
