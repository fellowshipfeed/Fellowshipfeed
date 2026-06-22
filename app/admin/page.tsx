import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TopBar } from '@/components/TopBar';
import { ApprovalQueue } from './ApprovalQueue';
import type { PendingPost, Session } from '@/lib/types';
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

  const { data: pendingData } = await supabase
    .from('posts')
    .select(`
      id, body, group_id, created_at,
      author:users!posts_author_id_fkey(id, name, initials),
      group:groups(id, name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const pending: PendingPost[] = (pendingData ?? []).map(row => ({
    id: row.id,
    body: row.body,
    group_id: row.group_id,
    created_at: row.created_at,
    author: firstRelation(row.author),
    group: firstRelation(row.group),
  }));

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
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Pending approvals</h1>
            <div className="text-xs text-ink-muted">
              {pending.length > 0
                ? `${pending.length} post${pending.length === 1 ? '' : 's'} waiting for your review`
                : "You're all caught up"}
            </div>
          </div>
        </div>

        <ApprovalQueue initialPending={pending} currentUserId={session.user_id} />
      </div>
    </div>
  );
}
