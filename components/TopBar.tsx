'use client';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/format';

type Props = {
  orgName: string;
  city?: string | null;
  userName: string;
  userInitials: string;
  rolePill?: 'Admin' | 'Head' | null;
};

export function TopBar({ orgName, city, userName, userInitials, rolePill }: Props) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }
  const pillStyle = rolePill === 'Head'
    ? 'bg-head text-white'
    : rolePill === 'Admin'
    ? 'bg-accent text-white'
    : '';

  return (
    <div className="bg-white border-b border-line px-7 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center font-display font-semibold text-sm">
          {getInitials(orgName)}
        </div>
        <div className="leading-tight">
          <div className="font-display font-medium text-[15px] tracking-tight">{orgName}</div>
          {city && <div className="text-[11px] text-ink-muted">{city}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-cream-soft border border-line">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">{userInitials}</div>
          <span className="text-[13px] font-medium pl-1">{userName}</span>
          {rolePill && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider mr-1 ${pillStyle}`}>
              {rolePill}
            </span>
          )}
        </div>
        <button onClick={signOut} className="text-xs text-ink-muted hover:text-ink">Sign out</button>
      </div>
    </div>
  );
}
