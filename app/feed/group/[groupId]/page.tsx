import { Suspense } from 'react';
import { MemberPortal } from '@/components/member/MemberPortal';
import { loadFeedPage } from '@/lib/load-feed-page';

export const dynamic = 'force-dynamic';

export default async function GroupFeedPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const data = await loadFeedPage();

  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <MemberPortal {...data} initialGroupId={groupId} />
    </Suspense>
  );
}
