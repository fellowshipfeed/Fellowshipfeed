import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { MemberPortal } from '@/components/member/MemberPortal';
import type { FeedGroup, FeedPost, OrgResource, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';
import { filterOrgResources } from '@/lib/org-resources';

export const dynamic = 'force-dynamic';

const postSelect = `
  id, body, group_id, is_parish_wide, status, created_at,
  author:users!posts_author_id_fkey(id, name, initials),
  attachments(id, type, url, metadata)
`;

function mapPosts(rows: Record<string, unknown>[] | null): FeedPost[] {
  return (rows ?? []).map(row => ({
    id: row.id as string,
    body: row.body as string,
    group_id: row.group_id as string | null,
    is_parish_wide: row.is_parish_wide as boolean,
    status: row.status as string,
    created_at: row.created_at as string,
    author: firstRelation(row.author as FeedPost['author'] | FeedPost['author'][]),
    attachments: (row.attachments as FeedPost['attachments']) ?? [],
  }));
}

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;
  if (!session) redirect('/login');
  if (!session.org_id) redirect('/console');

  const { data: org } = await supabase.from('orgs').select('city').eq('id', session.org_id).single();

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, slug, color')
    .in('id', session.member_group_ids || []);

  const { data: approvedData } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: pendingData } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('author_id', session.user_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: resourcesData } = await supabase
    .from('org_resources')
    .select('url, enabled, resource:standard_resources(key, label, sort_order)')
    .eq('org_id', session.org_id)
    .eq('enabled', true);

  const resources: OrgResource[] = (resourcesData ?? [])
    .map(row => {
      const resource = firstRelation(row.resource as { key: string; label: string; sort_order: number } | { key: string; label: string; sort_order: number }[]);
      if (!resource) return null;
      return { key: resource.key, label: resource.label, url: row.url as string | null };
    })
    .filter((r): r is OrgResource => r !== null);

  return (
    <MemberPortal
      session={session}
      orgCity={(org?.city as string | null) ?? null}
      groups={(groupsData ?? []) as FeedGroup[]}
      resources={filterOrgResources(resources)}
      approvedPosts={mapPosts(approvedData as Record<string, unknown>[] | null)}
      pendingPosts={mapPosts(pendingData as Record<string, unknown>[] | null)}
    />
  );
}
