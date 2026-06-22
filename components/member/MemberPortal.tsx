'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { FeedGroup, FeedPost, Session } from '@/lib/types';
import { getGroupStyle } from '@/lib/group-styles';
import { getInitials } from '@/lib/format';
import { MemberTopBar } from './MemberTopBar';
import { MemberSidebar, type FeedView } from './MemberSidebar';
import { PostCard } from './PostCard';
import type { OrgResource } from '@/lib/types';

type Props = {
  session: Session;
  orgCity: string | null;
  groups: FeedGroup[];
  resources: OrgResource[];
  approvedPosts: FeedPost[];
  pendingPosts: FeedPost[];
};

export function MemberPortal({
  session,
  orgCity,
  groups,
  resources,
  approvedPosts,
  pendingPosts,
}: Props) {
  const [view, setView] = useState<FeedView>('home');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [pending, setPending] = useState(pendingPosts);
  const [body, setBody] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;
  const headerStyle = activeGroup ? getGroupStyle(activeGroup.slug) : getGroupStyle('home');

  const visiblePosts = useMemo(() => {
    if (view === 'pending') return pending;
    if (view === 'group' && activeGroupId) {
      return approvedPosts.filter(p => p.group_id === activeGroupId && !p.is_parish_wide);
    }
    return approvedPosts;
  }, [view, activeGroupId, approvedPosts, pending]);

  function handleViewChange(next: FeedView, groupId?: string | null) {
    setView(next);
    setActiveGroupId(groupId ?? null);
  }

  async function cancelPendingPost(postId: string) {
    if (!window.confirm('Cancel this post? It will be removed from the review queue.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('status', 'pending');
    if (error) {
      setMessage(error.message);
      return;
    }
    setPending(prev => prev.filter(p => p.id !== postId));
  }

  async function submitPost() {
    if (!body.trim() || !selectedGroup || !session.org_id) return;
    setSubmitting(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('posts').insert({
      author_id: session.user_id,
      group_id: selectedGroup,
      org_id: session.org_id,
      body: body.trim(),
      status: 'pending',
      is_parish_wide: false,
    });
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
    } else {
      setBody('');
      setMessage('Submitted for review — your group admin will see it shortly.');
      setTimeout(() => setMessage(''), 4000);
      window.location.reload();
    }
  }

  const showComposer = view === 'home' || view === 'group';
  const title =
    view === 'pending'
      ? 'Posts Pending Review'
      : view === 'group' && activeGroup
        ? activeGroup.name
        : 'My Feed';
  const meta =
    view === 'pending'
      ? 'Your posts awaiting admin approval'
      : view === 'group' && activeGroup
        ? `${visiblePosts.length} approved post${visiblePosts.length === 1 ? '' : 's'}`
        : `All groups · ${groups.length} joined`;

  return (
    <div className="min-h-screen bg-cream">
      <MemberTopBar
        orgName={session.org_name}
        orgCity={orgCity}
        userName={session.name}
        userInitials={session.initials}
        showAdminLink={session.primary_role === 'group_admin' || session.primary_role === 'head'}
      />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <MemberSidebar
          groups={groups}
          resources={resources}
          activeView={view}
          activeGroupId={activeGroupId}
          pendingCount={pending.length}
          onViewChange={handleViewChange}
        />

        <main className="min-w-0">
          <div className="bg-white border border-line rounded-xl p-5 sm:p-6 mb-4 flex gap-4 items-center">
            {(view === 'pending' || (view === 'group' && activeGroup)) && (
              <div className={`w-[52px] h-[52px] rounded-[10px] flex items-center justify-center font-display text-xl font-medium shrink-0 ${headerStyle.icon}`}>
                {view === 'pending' ? (
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : (
                  getInitials(activeGroup!.name, 2)
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
              <p className="text-xs text-ink-muted mt-1">{meta}</p>
            </div>
          </div>

          {pending.length > 0 && view !== 'pending' && (
            <div className="bg-pending-soft border border-pending rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-pending shrink-0" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="flex-1">
                You have <strong className="text-pending font-semibold">{pending.length}</strong> post
                {pending.length === 1 ? '' : 's'} awaiting admin review.
              </span>
              <button type="button" onClick={() => handleViewChange('pending')} className="text-pending text-xs font-medium underline">
                See pending
              </button>
            </div>
          )}

          {showComposer && (
            <div className="bg-white border border-line rounded-xl p-4 mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center shrink-0">
                  {session.initials}
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Say something with your group(s)…"
                  rows={2}
                  className="flex-1 p-2 border-0 bg-transparent focus:outline-none resize-none text-sm placeholder:text-ink-muted"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-line-soft">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>Post to:</span>
                  <select
                    value={selectedGroup}
                    onChange={e => setSelectedGroup(e.target.value)}
                    className="text-xs border border-line rounded-md px-2 py-1 bg-white"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <span className="hidden sm:flex items-center gap-1 text-pending">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    Reviewed before posting
                  </span>
                </div>
                <button
                  type="button"
                  onClick={submitPost}
                  disabled={submitting || !body.trim()}
                  className="bg-accent text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
              </div>
              {message && (
                <div className="mt-2 text-xs text-success bg-success-soft border border-success/20 rounded p-2">{message}</div>
              )}
            </div>
          )}

          {visiblePosts.length === 0 ? (
            <div className="bg-white border border-dashed border-line rounded-xl p-12 text-center">
              <div className="text-2xl mb-2">{view === 'pending' ? '✓' : '👋'}</div>
              <h3 className="font-display text-lg font-medium mb-1">
                {view === 'pending' ? 'Nothing pending' : 'Welcome'}
              </h3>
              <p className="text-sm text-ink-soft max-w-xs mx-auto">
                {view === 'pending'
                  ? 'When you submit a post, it appears here until an admin approves it.'
                  : 'When members of your groups post, you will see it here.'}
              </p>
            </div>
          ) : (
            visiblePosts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                groups={groups}
                onCancel={view === 'pending' ? cancelPendingPost : undefined}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
