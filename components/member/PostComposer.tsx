'use client';

import { useState } from 'react';
import type { FeedGroup } from '@/lib/types';
import { GroupChip } from './GroupChip';

type Props = {
  userInitials: string;
  groups: FeedGroup[];
  fixedGroupId?: string | null;
  onSubmit: (body: string, groupIds: string[]) => Promise<void>;
};

export function PostComposer({ userInitials, groups, fixedGroupId, onSubmit }: Props) {
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(fixedGroupId ? [fixedGroupId] : groups.map(g => g.id)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  function toggleGroup(id: string) {
    if (fixedGroupId) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!body.trim() || selected.size === 0) return;
    setSubmitting(true);
    setMessage('');
    try {
      await onSubmit(body.trim(), Array.from(selected));
      setBody('');
      setMessage('Submitted for review — your group admin will see it shortly.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not submit post');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = body.trim().length > 0 && selected.size > 0 && !submitting;

  return (
    <div className="bg-white border border-line rounded-xl p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-[38px] h-[38px] rounded-full bg-accent-soft text-accent font-semibold text-[13px] flex items-center justify-center shrink-0">
          {userInitials}
        </div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Say something with your group(s)…"
          rows={2}
          className="flex-1 border-0 bg-transparent focus:outline-none resize-none text-sm leading-relaxed placeholder:text-ink-muted min-h-[22px]"
        />
      </div>

      {!fixedGroupId && (
        <div className="flex flex-wrap gap-2 pb-3 mb-3 border-b border-line-soft pl-[50px]">
          <span className="text-[11px] text-ink-muted font-medium self-center mr-1">Post to:</span>
          {groups.map(g => (
            <GroupChip
              key={g.id}
              group={g}
              selected={selected.has(g.id)}
              onClick={() => toggleGroup(g.id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pl-[50px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-soft opacity-50 cursor-not-allowed"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="5.5" cy="6" r="1.2" fill="currentColor" />
              <path
                d="M2 10.5l3.5-3 3 3 2-2 3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-soft opacity-50 cursor-not-allowed"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path
                d="M6.5 8h3M7 5.5H4.5a2.5 2.5 0 000 5H7M9 10.5h2.5a2.5 2.5 0 000-5H9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-soft opacity-50 cursor-not-allowed"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path
                d="M3.5 1.5h6L13 5v8.5a1 1 0 01-1 1H3.5a1 1 0 01-1-1v-11a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M9.5 1.5V5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="w-2" />
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-muted">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-pending" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Will be reviewed by admin before posting
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-accent text-white font-medium text-[13px] px-[18px] py-2 rounded-md hover:bg-accent-hover disabled:bg-ink-muted disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
      {message && (
        <div className="mt-2 ml-[50px] text-xs text-success bg-success-soft border border-success/20 rounded p-2">
          {message}
        </div>
      )}
    </div>
  );
}
