import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TopBar } from '@/components/TopBar';
import { ComposerAndFeed } from './ComposerAndFeed';
import type { FeedGroup, FeedPost, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;
  if (!session) redirect('/login');

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, slug, color')
    .in('id', session.member_group_ids || []);

  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      id, body, group_id, is_parish_wide, status, created_at,
      author:users!posts_author_id_fkey(id, name, initials),
      attachments(id, type, url, metadata)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  const groups = (groupsData ?? []) as FeedGroup[];
  const posts: FeedPost[] = (postsData ?? []).map(row => ({
    id: row.id,
    body: row.body,
    group_id: row.group_id,
    is_parish_wide: row.is_parish_wide,
    status: row.status,
    created_at: row.created_at,
    author: firstRelation(row.author),
    attachments: row.attachments ?? [],
  }));

  return (
    <div>
      <TopBar
        orgName={session.org_name}
        city={null}
        userName={session.name}
        userInitials={session.initials}
        rolePill={null}
      />

      <div className="max-w-3xl mx-auto px-6 py-6">
        <h1 className="font-display text-3xl font-medium mb-6 tracking-tight">My feed</h1>

        <ComposerAndFeed
          groups={groups}
          initialPosts={posts}
          currentUserId={session.user_id}
          orgId={session.org_id}
        />
      </div>
    </div>
  );
}
