'use client';

import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/format';

type Props = {
  orgName: string;
  orgCity?: string | null;
  userName: string;
  userInitials: string;
  showAdminLink?: boolean;
};

export function MemberTopBar({ orgName, orgCity, userName, userInitials, showAdminLink }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-line px-7 py-3.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center font-display font-semibold text-sm">
          {getInitials(orgName)}
        </div>
        <div className="leading-tight">
          <div className="font-display font-medium text-[15px] tracking-tight">{orgName}</div>
          {orgCity && <div className="text-[11px] text-ink-muted">{orgCity}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showAdminLink && (
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-xs font-medium text-accent hover:text-accent-hover hidden sm:block"
          >
            Admin
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-cream-soft border border-line flex items-center justify-center text-ink-soft relative">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 7a5 5 0 0110 0v3l1 2H2l1-2V7zM6 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-cream-soft border border-line">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">
            {userInitials}
          </div>
          <span className="text-[13px] font-medium pl-1 pr-2 hidden sm:inline">{userName.split(' ')[0]}</span>
        </div>
        <button type="button" onClick={signOut} className="text-xs text-ink-muted hover:text-ink">
          Sign out
        </button>
      </div>
    </header>
  );
}
