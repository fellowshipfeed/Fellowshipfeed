import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TopBar } from '@/components/TopBar';
import { AdminPanel } from '@/components/admin/AdminPanel';
import type { AdminEvent, OrgCalendarSettings, PendingPost, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';

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

  const [
    { data: pendingData },
    { data: groupsData },
    { data: eventsData },
    { data: orgData },
  ] = await Promise.all([
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
      ? supabase.from('groups').select('id, name').eq('org_id', session.org_id).order('name')
      : supabase.from('groups').select('id, name').in('id', adminGroupIds).order('name'),
    supabase
      .from('events')
      .select('id, title, description, starts_at, location, capacity, group_id, group:groups(id, name)')
      .eq('org_id', session.org_id)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(50),
    supabase
      .from('orgs')
      .select('google_calendar_url, calendar_ics_url')
      .eq('id', session.org_id)
      .single(),
  ]);

  let pendingRows = pendingData ?? [];
  if (!isHeadOrOwner && adminGroupIds.length > 0) {
    pendingRows = pendingRows.filter(row => adminGroupIds.includes(row.group_id as string));
  } else if (!isHeadOrOwner) {
    pendingRows = [];
  }

  const pending: PendingPost[] = pendingRows.map(row => ({
    id: row.id as string,
    body: row.body as string,
    group_id: row.group_id as string,
    created_at: row.created_at as string,
    author: firstRelation(row.author),
    group: firstRelation(row.group),
  }));

  const groups = (groupsData ?? []).map(g => ({ id: g.id as string, name: g.name as string }));

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
    google_calendar_url: (orgData?.google_calendar_url as string | null) ?? null,
    calendar_ics_url: (orgData?.calendar_ics_url as string | null) ?? null,
  };

  return (
    <div>
      <TopBar
        orgName={session.org_name}
        userName={session.name}
        userInitials={session.initials}
        rolePill="Admin"
      />
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white border border-line rounded-xl p-6 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8l3 3 7-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Admin</h1>
            <div className="text-xs text-ink-muted">
              Approve posts, create events, and manage the parish calendar.
            </div>
          </div>
        </div>

        <AdminPanel
          pending={pending}
          groups={groups}
          events={events}
          calendar={calendar}
          currentUserId={session.user_id}
          orgId={session.org_id!}
          canManageCalendar={isHeadOrOwner}
        />
      </div>
    </div>
  );
}
