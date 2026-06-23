import { Suspense } from 'react';
import { MemberPortal } from '@/components/member/MemberPortal';
import { loadFeedPage } from '@/lib/load-feed-page';
import type { FeedView } from '@/components/member/MemberSidebar';

export const dynamic = 'force-dynamic';

function resolveInitialView(group?: string, view?: string): FeedView {
  if (view === 'explore') return 'explore';
  if (view === 'pending') return 'pending';
  if (view === 'your-posts') return 'yourPosts';
  if (view === 'saved') return 'saved';
  if (group) return 'group';
  return 'home';
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; view?: string }>;
}) {
  const { group, view } = await searchParams;
  const data = await loadFeedPage();

  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <MemberPortal
        {...data}
        initialGroupId={group ?? null}
        initialView={resolveInitialView(group, view)}
      />
    </Suspense>
  );
}
