import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TopBar } from '@/components/TopBar';
import type { GroupAdmin, Session } from '@/lib/types';
import { firstRelation } from '@/lib/supabase-helpers';

export const dynamic = 'force-dynamic';

export default async function HeadPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;

  if (!session) redirect('/login');
  if (session.primary_role !== 'head' && session.primary_role !== 'owner') {
    redirect('/feed');
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, slug')
    .eq('org_id', session.org_id);

  const { data: adminsData } = await supabase
    .from('roles')
    .select('user_id, group_id, granted_at, user:users!roles_user_id_fkey(name, initials, email)')
    .eq('role_type', 'group_admin')
    .eq('org_id', session.org_id);

  const admins: GroupAdmin[] = (adminsData ?? []).map(row => ({
    user_id: row.user_id,
    group_id: row.group_id,
    granted_at: row.granted_at,
    user: firstRelation(row.user),
  }));

  return (
    <div>
      <TopBar
        orgName={session.org_name}
        userName={session.name}
        userInitials={session.initials}
        rolePill="Head"
      />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm font-medium text-accent">Assign admins</span>
          <span className="text-ink-muted">·</span>
          <Link href="/head/people" className="text-sm text-ink-muted hover:text-ink">
            Manage people →
          </Link>
        </div>
        <div className="bg-white border border-line rounded-xl p-6 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-head-soft text-head flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Assign admins</h1>
            <div className="text-xs text-ink-muted">Choose who runs each group at {session.org_name}</div>
          </div>
        </div>

        <div className="space-y-3">
          {groups?.map(g => {
            const groupAdmins = admins.filter(a => a.group_id === g.id);
            return (
              <div key={g.id} className="bg-white border border-line rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-line-soft">
                  <div className="font-display text-base font-medium">{g.name}</div>
                  <div className="text-xs text-ink-muted">{groupAdmins.length} admin{groupAdmins.length === 1 ? '' : 's'}</div>
                </div>
                {groupAdmins.length === 0 ? (
                  <div className="px-5 py-3 text-sm text-ink-muted bg-cream-soft">No admin assigned · you&apos;re moderating this group directly</div>
                ) : (
                  groupAdmins.map(a => (
                    <div key={a.user_id} className="px-5 py-3 flex items-center gap-3 bg-cream-soft border-b border-line-soft last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">{a.user?.initials}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{a.user?.name}</div>
                        <div className="text-[11px] text-ink-muted">{a.user?.email}</div>
                      </div>
                      <span className="bg-accent text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
