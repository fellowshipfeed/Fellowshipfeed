'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Pending = {
  id: string; body: string; group_id: string | null; created_at: string;
  author: { id: string; name: string; initials: string };
  group: { id: string; name: string } | null;
};

export function ApprovalQueue({ initialPending, currentUserId }: {
  initialPending: Pending[]; currentUserId: string;
}) {
  const [pending, setPending] = useState<Pending[]>(initialPending);
  const [message, setMessage] = useState('');

  async function approve(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('posts')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: currentUserId })
      .eq('id', id);
    if (error) { setMessage('Error: ' + error.message); return; }
    await supabase.from('moderation_log').insert({ post_id: id, admin_id: currentUserId, action: 'approved' });
    setPending(p => p.filter(x => x.id !== id));
    setMessage('Approved — now live in the feed.');
    setTimeout(() => setMessage(''), 3000);
  }

  async function reject(id: string) {
    const reason = window.prompt("Reason (the member will see this — be kind):");
    if (reason === null) return;
    const supabase = createClient();
    await supabase.from('posts').update({ status: 'rejected' }).eq('id', id);
    await supabase.from('moderation_log').insert({ post_id: id, admin_id: currentUserId, action: 'rejected', reason });
    setPending(p => p.filter(x => x.id !== id));
    setMessage('Rejected — member has been notified.');
    setTimeout(() => setMessage(''), 3000);
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white border border-dashed border-line rounded-xl p-12 text-center">
        <div className="text-2xl mb-2">✓</div>
        <h3 className="font-display text-lg font-medium mb-1">All clear</h3>
        <p className="text-sm text-ink-soft max-w-xs mx-auto">Nothing to review right now. Members' posts appear here as they come in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded p-3">{message}</div>}
      {pending.map(p => {
        const time = new Date(p.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        return (
          <div key={p.id} className="bg-white border border-line rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-accent mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
              {p.group?.name || 'Parish-wide'}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">{p.author.initials}</div>
              <div>
                <div className="font-medium text-sm">{p.author.name}</div>
                <div className="text-[11px] text-ink-muted">Submitted {time}</div>
              </div>
            </div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap mb-4">{p.body}</div>
            <div className="flex gap-2 pt-3 border-t border-line-soft">
              <button onClick={() => reject(p.id)} className="text-sm px-3 py-1.5 border border-line rounded-md text-red-700 hover:bg-red-50 hover:border-red-300">Reject</button>
              <button onClick={() => approve(p.id)} className="ml-auto text-sm px-4 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 font-medium flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
