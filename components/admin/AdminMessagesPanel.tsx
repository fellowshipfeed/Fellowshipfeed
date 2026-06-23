'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { AdminMessage } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';

type Props = {
  messages: AdminMessage[];
  currentUserId: string;
  onMessagesChange: (messages: AdminMessage[]) => void;
};

export function AdminMessagesPanel({
  messages: initialMessages,
  currentUserId,
  onMessagesChange,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState<string | null>(initialMessages[0]?.id ?? null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selected = messages.find(m => m.id === selectedId) ?? null;

  function syncMessages(next: AdminMessage[]) {
    setMessages(next);
    onMessagesChange(next);
  }

  async function selectMessage(msg: AdminMessage) {
    setSelectedId(msg.id);
    if (msg.read_at) return;

    const supabase = createClient();
    const readAt = new Date().toISOString();
    await supabase.from('messages').update({ read_at: readAt }).eq('id', msg.id);
    syncMessages(messages.map(m => (m.id === msg.id ? { ...m, read_at: readAt } : m)));
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected?.from_user?.id || !reply.trim()) return;

    setSending(true);
    setError('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('messages').insert({
      from_user_id: currentUserId,
      to_user_id: selected.from_user.id,
      group_id: selected.group_id,
      body: reply.trim(),
    });
    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setReply('');
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white border border-dashed border-line rounded-xl py-12 px-6 text-center">
        <div className="text-2xl mb-2">💬</div>
        <h3 className="font-display text-lg font-medium mb-1">No messages yet</h3>
        <p className="text-sm text-ink-soft max-w-xs mx-auto">
          When members use &ldquo;Ask admin&rdquo; on a group, their questions appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[420px]">
      <div className="md:w-[280px] border-b md:border-b-0 md:border-r border-line-soft shrink-0">
        <div className="px-4 py-3 border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Inbox
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {messages.map(msg => (
            <button
              key={msg.id}
              type="button"
              onClick={() => selectMessage(msg)}
              className={`w-full text-left px-4 py-3 border-b border-line-soft last:border-b-0 hover:bg-cream-soft ${
                selectedId === msg.id ? 'bg-accent-soft/40' : ''
              } ${!msg.read_at ? 'bg-pending-soft/20' : ''}`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-ink truncate">{msg.from_user?.name ?? 'Member'}</span>
                {!msg.read_at && <span className="w-1.5 h-1.5 rounded-full bg-pending shrink-0" />}
              </div>
              <p className="text-xs text-ink-soft line-clamp-2">{msg.body}</p>
              <p className="text-[10px] text-ink-muted mt-1">
                {msg.group_name ?? 'Group'} · {formatRelativeTime(msg.created_at)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="px-5 py-4 border-b border-line-soft">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">
                  {selected.from_user?.initials ?? '?'}
                </div>
                <div>
                  <div className="font-medium text-sm">{selected.from_user?.name ?? 'Member'}</div>
                  <div className="text-xs text-ink-muted">
                    {selected.group_name ?? 'Group'} · {formatRelativeTime(selected.created_at)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 px-5 py-4 overflow-y-auto">
              <div className="bg-cream-soft border border-line rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.body}
              </div>
            </div>
            <form onSubmit={sendReply} className="px-5 py-4 border-t border-line-soft space-y-2">
              <label className="block">
                <span className="text-xs font-medium text-ink-soft">Reply to {selected.from_user?.name}</span>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  placeholder="Write your reply…"
                  className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
                />
              </label>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send reply'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-muted p-6">
            Select a message to read and reply
          </div>
        )}
      </div>
    </div>
  );
}
