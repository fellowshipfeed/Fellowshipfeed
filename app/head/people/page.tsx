import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TopBar } from '@/components/TopBar';
import { PeopleManager } from '@/components/head/PeopleManager';
import type { FeedGroup, OrgUser, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';

export const dynamic = 'force-dynamic';

export default async function HeadPeoplePage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;

  if (!session) redirect('/login');
  if (session.primary_role !== 'head' && session.primary_role !== 'owner') {
    redirect('/feed');
  }
  if (!session.org_id) redirect('/console');

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, slug, color')
    .eq('org_id', session.org_id);

  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, name, initials')
    .eq('org_id', session.org_id)
    .order('name');

  const { data: rolesData } = await supabase
    .from('roles')
    .select('user_id, role_type, group_id, group:groups(name)')
    .eq('org_id', session.org_id);

  const groups = (groupsData ?? []) as FeedGroup[];
  const rolesByUser = new Map(
    (rolesData ?? []).map(r => [
      r.user_id,
      {
        role_type: r.role_type as OrgUser['role_type'],
        group_id: r.group_id as string | null,
        group_name: firstRelation(r.group)?.name ?? null,
      },
    ])
  );

  const users: OrgUser[] = (usersData ?? []).map(u => {
    const role = rolesByUser.get(u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      initials: u.initials,
      role_type: role?.role_type ?? 'member',
      group_id: role?.group_id ?? null,
      group_name: role?.group_name ?? null,
    };
  });

  return (
    <div>
      <TopBar
        orgName={session.org_name}
        userName={session.name}
        userInitials={session.initials}
        rolePill="Head"
      />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link href="/head" className="text-sm text-ink-muted hover:text-ink">
            ← Assign admins
          </Link>
          <span className="text-ink-muted">·</span>
          <span className="text-sm font-medium text-accent">Manage people</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-6 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-head-soft text-head flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Manage people</h1>
            <div className="text-xs text-ink-muted">
              Edit names and roles for members at {session.org_name}
            </div>
          </div>
        </div>

        <PeopleManager
          session={session}
          users={users}
          groups={groups}
          canAssignHead={session.primary_role === 'owner'}
        />
      </div>
    </div>
  );
}
