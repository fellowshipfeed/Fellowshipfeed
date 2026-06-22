import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Session } from '@/lib/types';
import { getInitials } from '@/lib/format';

type Org = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  plan: string;
  created_at: string;
};

export const dynamic = 'force-dynamic';

export default async function ConsolePage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('my_session').select('*').single();
  const session = sessionData as Session | null;
  if (!session || session.primary_role !== 'owner') redirect('/feed');

  const { data: orgsData } = await supabase.from('orgs').select('id, name, slug, city, plan, created_at').order('created_at', { ascending: false });
  const orgs = (orgsData ?? []) as Org[];
  const { data: resources } = await supabase.from('standard_resources').select('*').order('sort_order');

  return (
    <div className="bg-[#0F1419] text-[#E8EBED] min-h-screen">
      <div className="border-b border-[#2A343D] px-7 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#6B9FE3] text-[#0F1419] flex items-center justify-center font-display font-bold">F</div>
          <div>
            <div className="font-display font-medium">FellowshipFeed</div>
            <div className="text-[10px] text-[#A0A8AE] uppercase tracking-wider font-mono">owner</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6B9FE3] text-[#0F1419] flex items-center justify-center font-semibold text-xs">{session.initials}</div>
          <span className="text-sm">{session.name}</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-7 py-7">
        <h1 className="font-display text-3xl font-medium mb-2 tracking-tight">Platform overview</h1>
        <div className="text-sm text-[#A0A8AE] mb-7">{orgs.length} organization{orgs.length === 1 ? '' : 's'} · {resources?.length || 0} standard resources</div>

        <div className="grid grid-cols-2 gap-3 mb-7">
          <div className="bg-[#1B232A] border border-[#2A343D] rounded-lg p-5">
            <div className="text-[10px] uppercase tracking-wider text-[#A0A8AE] font-semibold mb-2">Organizations</div>
            <div className="font-display text-3xl font-medium">{orgs.length}</div>
          </div>
          <div className="bg-[#1B232A] border border-[#2A343D] rounded-lg p-5">
            <div className="text-[10px] uppercase tracking-wider text-[#A0A8AE] font-semibold mb-2">Standard resources</div>
            <div className="font-display text-3xl font-medium">{resources?.length || 0}</div>
          </div>
        </div>

        <h2 className="font-display text-xl font-medium mb-3">Organizations</h2>
        <div className="bg-[#1B232A] border border-[#2A343D] rounded-lg overflow-hidden">
          {orgs.map(o => (
            <div key={o.id} className="px-5 py-3 border-b border-[#232C34] last:border-b-0 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#232C34] flex items-center justify-center font-display font-medium text-sm">{getInitials(o.name)}</div>
              <div className="flex-1">
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-[#A0A8AE]">{o.city || '—'}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded bg-[#232C34] text-[#A0A8AE]">{o.plan}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
