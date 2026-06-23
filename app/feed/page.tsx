import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { MemberPortal } from '@/components/member/MemberPortal';
import { parseSignupConfig } from '@/lib/signup-fields';
import type { FeedEvent, FeedGroup, FeedPost, OrgCalendarSettings, OrgResource, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';
import { buildMemberResources } from '@/lib/org-resources';
import { EMPTY_REACTIONS, aggregateReactions } from '@/lib/post-reactions';

export const dynamic = 'force-dynamic';

const postSelect = `
  id, body, group_id, is_parish_wide, pinned, status, created_at, signup_config,
  author:users!posts_author_id_fkey(id, name, initials),
  attachments(id, type, url, metadata)
`;

type RawPost = Record<string, unknown>;

function mapPosts(
  rows: RawPost[] | null,
  reactionMap: Map<string, { reactions: FeedPost['reactions']; my_reactions: string[] }>,
  savedIds: Set<string>,
  adminPairs: Set<string>,
  signupCounts: Map<string, number>,
  userSignups: Set<string>,
): FeedPost[] {
  return (rows ?? []).map(row => {
    const id = row.id as string;
    const author = firstRelation(row.author as FeedPost['author'] | FeedPost['author'][]);
    const groupId = row.group_id as string | null;
    const reactionEntry = reactionMap.get(id);
    const adminKey = author && groupId ? `${author.id}:${groupId}` : '';

    return {
      id,
      body: row.body as string,
      group_id: groupId,
      is_parish_wide: row.is_parish_wide as boolean,
      pinned: (row.pinned as boolean) ?? false,
      status: row.status as string,
      created_at: row.created_at as string,
      author,
      author_is_admin: adminKey ? adminPairs.has(adminKey) : false,
      attachments: (row.attachments as FeedPost['attachments']) ?? [],
      reactions: reactionEntry?.reactions ?? { ...EMPTY_REACTIONS },
      my_reactions: reactionEntry?.my_reactions ?? [],
      saved: savedIds.has(id),
      signup_config: parseSignupConfig(row.signup_config),
      signup_count: signupCounts.get(id) ?? 0,
      user_signed_up: userSignups.has(id),
    };
  });
}

function sortPosts(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group: initialGroupId } = await searchParams;
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;
  if (!session) redirect('/login');
  if (!session.org_id) redirect('/console');

  const memberGroupIds = session.member_group_ids ?? [];

  const [
    { data: org },
    { data: groupsData },
    { data: allGroupsData },
    { data: approvedData },
    { data: pendingData },
    { data: myPostsData },
    { data: resourcesData },
    { data: eventsData },
    { data: signupsData },
    { data: adminRolesData },
    { data: headRoleData },
    { data: membershipCounts },
  ] = await Promise.all([
    supabase.from('orgs').select('city, google_calendar_url, calendar_ics_url').eq('id', session.org_id).single(),
    supabase.from('groups').select('id, name, slug, color, description').in('id', memberGroupIds),
    supabase.from('groups').select('id, name, slug, color, description').eq('org_id', session.org_id),
    supabase
      .from('posts')
      .select(postSelect)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('posts')
      .select(postSelect)
      .eq('author_id', session.user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select(postSelect)
      .eq('author_id', session.user_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('org_resources')
      .select('url, enabled, resource:standard_resources(key, label, sort_order)')
      .eq('org_id', session.org_id),
    supabase
      .from('events')
      .select('id, title, starts_at, location, group_id, group:groups(id, name, slug)')
      .eq('org_id', session.org_id)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(30),
    supabase.from('signups').select('event_id').eq('user_id', session.user_id),
    supabase
      .from('roles')
      .select('user_id, group_id, user:users(name)')
      .eq('role_type', 'group_admin')
      .eq('org_id', session.org_id),
    supabase
      .from('roles')
      .select('user_id')
      .eq('role_type', 'head')
      .eq('org_id', session.org_id)
      .limit(1)
      .maybeSingle(),
    supabase.from('group_memberships').select('group_id'),
  ]);

  const postIds = [
    ...new Set([
      ...(approvedData ?? []).map(p => (p as RawPost).id as string),
      ...(pendingData ?? []).map(p => (p as RawPost).id as string),
      ...(myPostsData ?? []).map(p => (p as RawPost).id as string),
    ]),
  ];

  const [{ data: reactionsData }, { data: savesData }, { data: postSignupsData }] = await Promise.all([
    postIds.length
      ? supabase.from('reactions').select('post_id, kind, user_id').in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string; kind: string; user_id: string }[] }),
    supabase.from('saves').select('post_id').eq('user_id', session.user_id),
    postIds.length
      ? supabase.from('post_signups').select('post_id, user_id').in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
  ]);

  const signupCounts = new Map<string, number>();
  const userSignups = new Set<string>();
  for (const row of postSignupsData ?? []) {
    const postId = row.post_id as string;
    signupCounts.set(postId, (signupCounts.get(postId) ?? 0) + 1);
    if (row.user_id === session.user_id) userSignups.add(postId);
  }

  const savedIds = new Set((savesData ?? []).map(s => s.post_id as string));
  const reactionMap = aggregateReactions(
    (reactionsData ?? []) as { post_id: string; kind: string; user_id: string }[],
    session.user_id,
  );

  const adminPairs = new Set<string>();
  const adminByGroup = new Map<string, { name: string; userId: string }>();
  for (const row of adminRolesData ?? []) {
    const userId = row.user_id as string;
    const groupId = row.group_id as string;
    adminPairs.add(`${userId}:${groupId}`);
    const user = firstRelation(row.user as { name: string } | { name: string }[]);
    if (user && !adminByGroup.has(groupId)) {
      adminByGroup.set(groupId, { name: user.name, userId });
    }
  }

  const headUserId = (headRoleData?.user_id as string | undefined) ?? null;

  const countByGroup = new Map<string, number>();
  for (const row of membershipCounts ?? []) {
    const gid = row.group_id as string;
    countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
  }

  const joinedSet = new Set(memberGroupIds);
  const groups: FeedGroup[] = ((groupsData ?? []) as FeedGroup[]).map(g => {
    const admin = adminByGroup.get(g.id);
    return {
      ...g,
      member_count: countByGroup.get(g.id) ?? 0,
      admin_name: admin?.name ?? null,
      admin_user_id: admin?.userId ?? null,
      joined: true,
    };
  });

  const allGroups: FeedGroup[] = ((allGroupsData ?? []) as FeedGroup[]).map(g => {
    const admin = adminByGroup.get(g.id);
    return {
      ...g,
      member_count: countByGroup.get(g.id) ?? 0,
      admin_name: admin?.name ?? null,
      admin_user_id: admin?.userId ?? null,
      joined: joinedSet.has(g.id),
    };
  });

  const rsvpEventIds = new Set((signupsData ?? []).map(s => s.event_id as string));
  const events: FeedEvent[] = (eventsData ?? []).map(row => {
    const group = firstRelation(
      row.group as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[],
    );
    return {
      id: row.id as string,
      title: row.title as string,
      starts_at: row.starts_at as string,
      location: row.location as string | null,
      group_id: row.group_id as string | null,
      group_slug: group?.slug ?? null,
      group_name: group?.name ?? null,
      rsvped: rsvpEventIds.has(row.id as string),
    };
  });

  const resources: OrgResource[] = buildMemberResources(
    (resourcesData ?? [])
      .map(row => {
        const resource = firstRelation(
          row.resource as { key: string; label: string; sort_order: number } | { key: string; label: string; sort_order: number }[],
        );
        if (!resource) return null;
        return {
          key: resource.key,
          label: resource.label,
          url: row.url as string | null,
          enabled: row.enabled as boolean,
        };
      })
      .filter((r): r is OrgResource & { enabled: boolean } => r !== null),
  );

  const approvedPosts = sortPosts(
    mapPosts(approvedData as RawPost[] | null, reactionMap, savedIds, adminPairs, signupCounts, userSignups),
  );
  const pendingPosts = mapPosts(
    pendingData as RawPost[] | null,
    reactionMap,
    savedIds,
    adminPairs,
    signupCounts,
    userSignups,
  );
  const myPosts = sortPosts(
    mapPosts(myPostsData as RawPost[] | null, reactionMap, savedIds, adminPairs, signupCounts, userSignups),
  );

  const calendar: OrgCalendarSettings = {
    google_calendar_url: (org?.google_calendar_url as string | null) ?? null,
    calendar_ics_url: (org?.calendar_ics_url as string | null) ?? null,
  };

  return (
    <MemberPortal
      session={session}
      orgCity={(org?.city as string | null) ?? null}
      groups={groups}
      allGroups={allGroups}
      resources={resources}
      events={events}
      calendar={calendar}
      headUserId={headUserId}
      approvedPosts={approvedPosts}
      pendingPosts={pendingPosts}
      myPosts={myPosts}
      initialGroupId={initialGroupId ?? null}
    />
  );
}
