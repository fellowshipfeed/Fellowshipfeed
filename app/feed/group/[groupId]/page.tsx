import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GroupFeedPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  redirect(`/feed?group=${groupId}`);
}
