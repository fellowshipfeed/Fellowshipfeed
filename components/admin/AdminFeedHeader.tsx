import type { ReactNode } from 'react';
import type { AdminView } from '@/lib/types';

const icons: Record<AdminView, { bg: string; content: ReactNode }> = {
  approvals: {
    bg: 'bg-pending-soft text-pending',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3 8l3 3 7-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  events: {
    bg: 'bg-accent-soft text-accent',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  calendar: {
    bg: 'bg-head-soft text-head',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  messages: {
    bg: 'bg-accent-soft text-accent',
    content: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V4z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

const copy: Record<AdminView, { title: string; meta: string }> = {
  approvals: {
    title: 'Pending approvals',
    meta: 'Review member posts and optionally add sign-ups',
  },
  events: {
    title: 'Events',
    meta: 'Create upcoming events for your groups or parish-wide',
  },
  calendar: {
    title: 'Parish calendar',
    meta: 'Connect Google Calendar or an ICS feed for members',
  },
  messages: {
    title: 'Messages',
    meta: 'Private questions from members in your groups',
  },
};

export function AdminFeedHeader({ view }: { view: AdminView }) {
  const icon = icons[view];
  const text = copy[view];

  return (
    <div className="bg-white border border-line rounded-xl p-5 sm:p-6 mb-4 flex gap-4 items-center">
      <div className={`w-[52px] h-[52px] rounded-[10px] flex items-center justify-center shrink-0 ${icon.bg}`}>
        {icon.content}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-[22px] font-medium tracking-tight">{text.title}</h1>
        <p className="text-xs text-ink-muted mt-1">{text.meta}</p>
      </div>
    </div>
  );
}
