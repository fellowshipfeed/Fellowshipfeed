'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { getInitials, formatRelativeTime } from '@/lib/format';
import type { AdminMessage } from '@/lib/types';

type Props = {
  orgName: string;
  orgCity?: string | null;
  userName: string;
  userInitials: string;
  mode?: 'member' | 'admin';
  unreadCount?: number;
  recentMessages?: AdminMessage[];
  onOpenMessages?: () => void;
  showAdminLink?: boolean;
};

export function MemberTopBar({
  orgName,
  orgCity,
  userName,
  userInitials,
  mode = 'member',
  unreadCount = 0,
  recentMessages = [],
  onOpenMessages,
  showAdminLink,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function handleBellClick() {
    if (mode === 'admin' && onOpenMessages) {
      setOpen(prev => !prev);
    }
  }

  function openMessagesView() {
    setOpen(false);
    onOpenMessages?.();
  }

  return (
    <header className="bg-white border-b border-line px-4 sm:px-7 py-3.5 flex items-center justify-between sticky top-0 z-20">
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
        {mode === 'admin' ? (
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="text-xs font-medium text-accent hover:text-accent-hover hidden sm:block"
          >
            Member feed
          </button>
        ) : (
          showAdminLink && (
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="text-xs font-medium text-accent hover:text-accent-hover hidden sm:block"
            >
              Admin
            </button>
          )
        )}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={handleBellClick}
            className="w-9 h-9 rounded-full bg-cream-soft border border-line flex items-center justify-center text-ink-soft relative"
            title="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 7a5 5 0 0110 0v3l1 2H2l1-2V7zM6 13a2 2 0 004 0"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-pending text-white text-[10px] font-semibold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && mode === 'admin' && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-line rounded-xl shadow-lg overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-line-soft flex items-center justify-between">
                <span className="text-sm font-medium">Messages</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold bg-pending text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {recentMessages.length === 0 ? (
                <div className="px-4 py-6 text-sm text-ink-muted text-center">No messages yet</div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {recentMessages.slice(0, 5).map(msg => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={openMessagesView}
                      className={`w-full text-left px-4 py-3 border-b border-line-soft last:border-b-0 hover:bg-cream-soft ${
                        !msg.read_at ? 'bg-pending-soft/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-ink">{msg.from_user?.name ?? 'Member'}</span>
                        {!msg.read_at && (
                          <span className="w-1.5 h-1.5 rounded-full bg-pending shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ink-soft line-clamp-2">{msg.body}</p>
                      <p className="text-[10px] text-ink-muted mt-1">
                        {msg.group_name ?? 'Group'} · {formatRelativeTime(msg.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={openMessagesView}
                className="w-full px-4 py-2.5 text-xs font-medium text-accent hover:bg-accent-soft border-t border-line-soft"
              >
                View all messages
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-cream-soft border border-line hover:bg-line-soft"
          title="Sign out"
        >
          <div className="w-[30px] h-[30px] rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">
            {userInitials}
          </div>
          <span className="text-[13px] font-medium hidden sm:inline">{userName.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}
