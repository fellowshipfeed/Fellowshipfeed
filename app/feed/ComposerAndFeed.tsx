'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Group = { id: string; name: string; slug: string; color: string };
type Post = {
  id: string; body: string; group_id: string | null; is_parish_wide: boolean;
  status: string; created_at: string;
  author: { id: string; name: string; initials: string };
  attachments: { id: string; type: string; url: string; metadata: any }[];
};

export function ComposerAndFeed({ groups, initialPosts, currentUserId, orgId }: {
  groups: Group[]; initialPosts: Post[]; currentUserId: string; orgId: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [body, setBody] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!body.trim() || !selectedGroup) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('posts').insert({
      author_id: currentUserId,
      group_id: selectedGroup,
      org_id: orgId,
      body: body.trim(),
      status: 'pending',
      is_parish_wide: false,
    });
    setSubmitting(false);
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setBody('');
      setMessage('Submitted for review — your group admin will see it shortly.');
      setTimeout(() => setMessage(''), 4000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="bg-white border border-line rounded-xl p-4">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Say something with your group(s)…"
          rows={3}
          className="w-full p-3 border border-line rounded-md bg-cream-soft focus:outline-none focus:border-accent focus:bg-white resize-none text-[14px]"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">Post to:</span>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="text-xs border border-line rounded px-2 py-1 bg-white">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <button
            onClick={submit}
            disabled={submitting || !body.trim()}
            className="bg-accent text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
        <div className="text-[11px] text-ink-muted mt-2 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Will be reviewed by admin before posting
        </div>
        {message && <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</div>}
      </div>

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="text-2xl mb-2">👋</div>
          <h3 className="font-display text-lg font-medium mb-1">Welcome</h3>
          <p className="text-sm text-ink-soft max-w-xs mx-auto">When members of your groups post, you'll see it here.</p>
        </div>
      ) : posts.map(p => {
        const group = groups.find(g => g.id === p.group_id);
        const groupName = p.is_parish_wide ? 'Parish-wide' : group?.name || 'Group';
        const time = new Date(p.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        return (
          <div key={p.id} className="bg-white border border-line rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-accent mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
              {groupName}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">{p.author.initials}</div>
              <div>
                <div className="font-medium text-sm">{p.author.name}</div>
                <div className="text-[11px] text-ink-muted">{time}</div>
              </div>
            </div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{p.body}</div>
          </div>
        );
      })}
    </div>
  );
}
