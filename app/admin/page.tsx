import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { AdminPortal } from '@/components/admin/AdminPortal';
import type {
  AdminEvent,
  AdminMessage,
  FeedGroup,
  OrgCalendarSettings,
  PendingPost,
  Session,
} from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';
import { buildMemberResources } from '@/lib/org-resources';
import { buildAdminBadgeIds, buildSidebarGroups } from '@/lib/sidebar-groups';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;

  if (!session) redirect('/login');
  if (session.primary_role !== 'group_admin' && session.primary_role !== 'head' && session.primary_role !== 'owner') {
    redirect('/feed');
  }

  const isHeadOrOwner = session.primary_role === 'head' || session.primary_role === 'owner';
  const adminGroupIds = session.admin_group_ids ?? [];
  const memberGroupIds = session.member_group_ids ?? [];

  const [
    { data: org },
    { data: pendingData },
    { data: groupsData },
    { data: memberGroupsData },
    { data: allGroupsData },
    { data: eventsData },
    { data: resourcesData },
    { data: messagesData },
  ] = await Promise.all([
    supabase
      .from('orgs')
      .select('city, google_calendar_url, calendar_ics_url')
      .eq('id', session.org_id)
      .single(),
    supabase
      .from('posts')
      .select(`
        id, body, group_id, created_at,
        author:users!posts_author_id_fkey(id, name, initials),
        group:groups(id, name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    isHeadOrOwner
      ? supabase
          .from('groups')
          .select('id, name, slug, color, description')
          .eq('org_id', session.org_id)
          .order('name')
      : supabase
          .from('groups')
          .select('id, name, slug, color, description')
          .in('id', adminGroupIds.length ? adminGroupIds : ['00000000-0000-0000-0000-000000000000'])
          .order('name'),
    supabase
      .from('groups')
      .select('id, name, slug, color, description')
      .in('id', memberGroupIds.length ? memberGroupIds : ['00000000-0000-0000-0000-000000000000'])
      .order('name'),
    supabase
      .from('groups')
      .select('id, name, slug, color, description')
      .eq('org_id', session.org_id)
      .order('name'),
    supabase
      .from('events')
      .select('id, title, description, starts_at, location, capacity, group_id, group:groups(id, name)')
      .eq('org_id', session.org_id)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(50),
    supabase
      .from('org_resources')
      .select('url, enabled, resource:standard_resources(key, label, sort_order)')
      .eq('org_id', session.org_id),
    supabase
      .from('messages')
      .select(`
        id, body, created_at, read_at, group_id,
        from_user:users!messages_from_user_id_fkey(id, name, initials),
        group:groups(name)
      `)
      .eq('to_user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  let pendingRows = pendingData ?? [];
  if (!isHeadOrOwner && adminGroupIds.length > 0) {
    pendingRows = pendingRows.filter(row => adminGroupIds.includes(row.group_id as string));
  } else if (!isHeadOrOwner) {
    pendingRows = [];
  }
  pendingRows = pendingRows.filter(row => {
    const author = firstRelation(
      row.author as { id: string } | { id: string }[] | null,
    );
    const groupId = row.group_id as string;
    if (author?.id === session.user_id && adminGroupIds.includes(groupId)) return false;
    return true;
  });

  const pending: PendingPost[] = pendingRows.map(row => ({
    id: row.id as string,
    body: row.body as string,
    group_id: row.group_id as string,
    created_at: row.created_at as string,
    author: firstRelation(row.author),
    group: firstRelation(row.group),
  }));

  const groups: FeedGroup[] = (groupsData ?? []).map(g => ({
    id: g.id as string,
    name: g.name as string,
    slug: g.slug as string,
    color: g.color as string,
    description: (g.description as string | null) ?? null,
  }));

  const mapFeedGroup = (g: Record<string, unknown>): FeedGroup => ({
    id: g.id as string,
    name: g.name as string,
    slug: g.slug as string,
    color: g.color as string,
    description: (g.description as string | null) ?? null,
  });

  const memberGroups = (memberGroupsData ?? []).map(mapFeedGroup);
  const allGroups = (allGroupsData ?? []).map(mapFeedGroup);
  const sidebarGroups = buildSidebarGroups(memberGroups, allGroups, session);
  const adminBadgeIds = [...buildAdminBadgeIds(sidebarGroups, session)];

  let eventRows = eventsData ?? [];
  if (!isHeadOrOwner) {
    eventRows = eventRows.filter(row => {
      const groupId = row.group_id as string | null;
      return groupId && adminGroupIds.includes(groupId);
    });
  }

  const events: AdminEvent[] = eventRows.map(row => {
    const group = firstRelation(row.group as { id: string; name: string } | { id: string; name: string }[]);
    return {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      starts_at: row.starts_at as string,
      location: row.location as string | null,
      capacity: (row.capacity as number | null) ?? null,
      group_id: row.group_id as string | null,
      group_name: group?.name ?? null,
    };
  });

  const calendar: OrgCalendarSettings = {
    google_calendar_url: (org?.google_calendar_url as string | null) ?? null,
    calendar_ics_url: (org?.calendar_ics_url as string | null) ?? null,
  };

  const resources = buildMemberResources(
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
      .filter((r): r is { key: string; label: string; url: string | null; enabled: boolean } => r !== null),
  );

  const messages: AdminMessage[] = (messagesData ?? []).map(row => {
    const fromUser = firstRelation(
      row.from_user as { id: string; name: string; initials: string } | { id: string; name: string; initials: string }[],
    );
    const group = firstRelation(row.group as { name: string } | { name: string }[]);
    return {
      id: row.id as string,
      body: row.body as string,
      created_at: row.created_at as string,
      read_at: (row.read_at as string | null) ?? null,
      group_id: row.group_id as string | null,
      group_name: group?.name ?? null,
      from_user: fromUser,
    };
  });

  return (
    <AdminPortal
      session={session}
      orgCity={(org?.city as string | null) ?? null}
      groups={groups}
      sidebarGroups={sidebarGroups}
      adminBadgeIds={adminBadgeIds}
      resources={resources}
      pending={pending}
      events={events}
      calendar={calendar}
      messages={messages}
      canManageCalendar={isHeadOrOwner}
    />
  );
}
