'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { ComposerAttachment } from '@/lib/composer-attachments';
import { saveAttachmentsForPost } from '@/lib/composer-attachments';
import type { FeedEvent, FeedGroup, FeedPost, OrgCalendarSettings, OrgResource, Session } from '@/lib/types';
import { MemberTopBar } from './MemberTopBar';
import { MemberSidebar, type FeedView } from './MemberSidebar';
import { PostCard } from './PostCard';
import { UpcomingEvents } from './UpcomingEvents';
import { PostComposer } from './PostComposer';
import { FeedHeader } from './FeedHeader';
import { ExploreGroups } from './ExploreGroups';
import { AskAdminModal } from './AskAdminModal';

type Props = {
  session: Session;
  orgCity: string | null;
  groups: FeedGroup[];
  allGroups: FeedGroup[];
  resources: OrgResource[];
  events: FeedEvent[];
  calendar: OrgCalendarSettings;
  approvedPosts: FeedPost[];
  pendingPosts: FeedPost[];
  myPosts: FeedPost[];
  headUserId: string | null;
  initialGroupId?: string | null;
};

function patchPost(posts: FeedPost[], postId: string, patch: Partial<FeedPost>): FeedPost[] {
  return posts.map(p => (p.id === postId ? { ...p, ...patch } : p));
}

function resolveGroup(
  groupId: string | null | undefined,
  memberGroups: FeedGroup[],
  all: FeedGroup[],
): FeedGroup | null {
  if (!groupId) return null;
  return memberGroups.find(g => g.id === groupId) ?? all.find(g => g.id === groupId) ?? null;
}

export function MemberPortal({
  session,
  orgCity,
  groups: initialGroups,
  allGroups: initialAllGroups,
  resources,
  events,
  calendar,
  approvedPosts: initialApproved,
  pendingPosts: initialPending,
  myPosts: initialMyPosts,
  headUserId,
  initialGroupId,
}: Props) {
  const router = useRouter();
  const bootGroup = resolveGroup(initialGroupId, initialGroups, initialAllGroups);
  const [view, setView] = useState<FeedView>(bootGroup ? 'group' : 'home');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(bootGroup?.id ?? null);
  const [groups, setGroups] = useState(initialGroups);
  const [allGroups, setAllGroups] = useState(initialAllGroups);
  const [approvedPosts, setApprovedPosts] = useState(initialApproved);
  const [pending, setPending] = useState(initialPending);
  const [myPosts, setMyPosts] = useState(initialMyPosts);
  const [askAdminGroup, setAskAdminGroup] = useState<FeedGroup | null>(null);

  const activeGroup = useMemo(
    () => resolveGroup(activeGroupId, groups, allGroups),
    [activeGroupId, groups, allGroups],
  );
  const memberGroupIds = useMemo(() => new Set(groups.map(g => g.id)), [groups]);
  const isHeadOrOwner = session.primary_role === 'head' || session.primary_role === 'owner';
  const adminGroupIds = useMemo(() => new Set(session.admin_group_ids ?? []), [session.admin_group_ids]);

  const sidebarGroups = useMemo(() => {
    const map = new Map(groups.map(g => [g.id, { ...g, joined: true as const }]));
    if (isHeadOrOwner) {
      for (const g of allGroups) {
        if (!map.has(g.id)) map.set(g.id, { ...g, joined: false });
      }
    } else if (session.primary_role === 'group_admin') {
      for (const g of allGroups) {
        if (adminGroupIds.has(g.id) && !map.has(g.id)) {
          map.set(g.id, { ...g, joined: false });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, allGroups, isHeadOrOwner, adminGroupIds, session.primary_role]);

  const canModerateActiveGroup =
    isHeadOrOwner || (activeGroupId != null && adminGroupIds.has(activeGroupId));

  const savedPosts = useMemo(() => approvedPosts.filter(p => p.saved), [approvedPosts]);
  const savedCount = savedPosts.length;

  const visibleEvents = useMemo(() => {
    if (view === 'home') {
      return events.filter(e => !e.group_id || memberGroupIds.has(e.group_id));
    }
    if (view === 'group' && activeGroupId) {
      return events.filter(e => e.group_id === activeGroupId);
    }
    return [];
  }, [view, activeGroupId, events, memberGroupIds]);

  const visiblePosts = useMemo(() => {
    if (view === 'pending') return pending;
    if (view === 'yourPosts') return myPosts;
    if (view === 'saved') return savedPosts;
    if (view === 'group' && activeGroupId) {
      return approvedPosts.filter(p => p.group_id === activeGroupId && !p.is_parish_wide);
    }
    if (view === 'home') {
      return approvedPosts.filter(
        p => p.is_parish_wide || (p.group_id && memberGroupIds.has(p.group_id)),
      );
    }
    return [];
  }, [view, activeGroupId, approvedPosts, pending, myPosts, savedPosts]);

  const showComposer =
    (view === 'home' || view === 'group') &&
    (view === 'home' || !activeGroupId || memberGroupIds.has(activeGroupId));
  const showEvents =
    (view === 'home' || view === 'group') &&
    (visibleEvents.length > 0 || Boolean(calendar.google_calendar_url || calendar.calendar_ics_url));

  function handleViewChange(next: FeedView, groupId?: string | null) {
    setView(next);
    setActiveGroupId(groupId ?? null);
    if (next === 'group' && groupId) {
      router.replace(`/feed?group=${groupId}`, { scroll: false });
    } else {
      router.replace('/feed', { scroll: false });
    }
  }

  const updatePostEverywhere = useCallback((postId: string, patch: Partial<FeedPost>) => {
    setApprovedPosts(prev => patchPost(prev, postId, patch));
    setMyPosts(prev => patchPost(prev, postId, patch));
  }, []);

  async function editPendingPost(postId: string, body: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('posts')
      .update({ body })
      .eq('id', postId)
      .eq('author_id', session.user_id)
      .eq('status', 'pending');
    if (error) throw new Error(error.message);

    const patch = { body };
    setPending(prev => patchPost(prev, postId, patch));
    setMyPosts(prev => patchPost(prev, postId, patch));
  }

  async function cancelPendingPost(postId: string) {
    if (!window.confirm('Cancel this post? It will be removed from the review queue.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('status', 'pending');
    if (error) return;
    setPending(prev => prev.filter(p => p.id !== postId));
  }

  async function submitPost(body: string, groupIds: string[], attachments: ComposerAttachment[]) {
    const supabase = createClient();
    for (const groupId of groupIds) {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          author_id: session.user_id,
          group_id: groupId,
          org_id: session.org_id,
          body: body || ' ',
          status: 'pending',
          is_parish_wide: false,
        })
        .select('id, created_at')
        .single();

      if (error) throw new Error(error.message);

      if (attachments.length > 0) {
        try {
          await saveAttachmentsForPost(supabase, post.id, session.org_id, attachments);
        } catch (uploadError) {
          await supabase.from('posts').delete().eq('id', post.id);
          throw uploadError instanceof Error
            ? uploadError
            : new Error('Could not upload attachments. Make sure post-attachments storage is configured.');
        }
      }

      const pendingPost: FeedPost = {
        id: post.id,
        body: body || ' ',
        group_id: groupId,
        is_parish_wide: false,
        pinned: false,
        status: 'pending',
        created_at: post.created_at,
        author: { id: session.user_id, name: session.name, initials: session.initials },
        attachments: [],
        reactions: { heart: 0, pray: 0, in: 0, amen: 0 },
        my_reactions: [],
        saved: false,
        signup_config: null,
        signup_count: 0,
        user_signed_up: false,
      };
      setPending(prev => [pendingPost, ...prev]);
      setMyPosts(prev => [pendingPost, ...prev]);
    }
    router.refresh();
  }

  async function leaveGroup(groupId: string) {
    const groupName = allGroups.find(g => g.id === groupId)?.name ?? 'this group';
    if (
      !window.confirm(
        `Leave ${groupName}? You will be unsubscribed and won't see its posts in your feed anymore.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('user_id', session.user_id)
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);

    setGroups(prev => prev.filter(g => g.id !== groupId));
    setAllGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, joined: false, member_count: Math.max(0, (g.member_count ?? 1) - 1) }
          : g,
      ),
    );

    if (view === 'group' && activeGroupId === groupId) {
      handleViewChange('explore');
    }

    router.refresh();
  }

  async function joinGroup(groupId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('group_memberships').insert({
      user_id: session.user_id,
      group_id: groupId,
    });
    if (error) throw new Error(error.message);
    const joined = allGroups.find(g => g.id === groupId);
    if (joined && !groups.some(g => g.id === groupId)) {
      setGroups(prev => [...prev, { ...joined, joined: true }]);
    }
    setAllGroups(prev => prev.map(g => (g.id === groupId ? { ...g, joined: true } : g)));
    router.refresh();
  }

  async function toggleReaction(postId: string, kind: string) {
    const supabase = createClient();
    const post =
      approvedPosts.find(p => p.id === postId) ??
      myPosts.find(p => p.id === postId) ??
      savedPosts.find(p => p.id === postId);
    if (!post) return;

    const has = post.my_reactions.includes(kind);
    if (has) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', session.user_id).eq('kind', kind);
      const reactions = { ...post.reactions };
      reactions[kind as keyof typeof reactions] = Math.max(0, reactions[kind as keyof typeof reactions] - 1);
      updatePostEverywhere(postId, {
        reactions,
        my_reactions: post.my_reactions.filter(k => k !== kind),
      });
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: session.user_id, kind });
      const reactions = { ...post.reactions };
      reactions[kind as keyof typeof reactions] += 1;
      updatePostEverywhere(postId, {
        reactions,
        my_reactions: [...post.my_reactions, kind],
      });
    }
  }

  async function handlePostSignup(postId: string) {
    const post = approvedPosts.find(p => p.id === postId) ?? myPosts.find(p => p.id === postId);
    if (!post) return;
    updatePostEverywhere(postId, {
      user_signed_up: true,
      signup_count: post.signup_count + 1,
    });
  }

  async function toggleSave(postId: string) {
    const supabase = createClient();
    const post =
      approvedPosts.find(p => p.id === postId) ??
      myPosts.find(p => p.id === postId) ??
      savedPosts.find(p => p.id === postId);
    if (!post) return;

    if (post.saved) {
      await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', session.user_id);
      updatePostEverywhere(postId, { saved: false });
    } else {
      await supabase.from('saves').insert({ post_id: postId, user_id: session.user_id });
      updatePostEverywhere(postId, { saved: true });
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <MemberTopBar
        orgName={session.org_name}
        orgCity={orgCity}
        userName={session.name}
        userInitials={session.initials}
        showAdminLink={
          session.primary_role === 'group_admin' ||
          session.primary_role === 'head' ||
          session.primary_role === 'owner'
        }
      />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <MemberSidebar
          groups={sidebarGroups}
          resources={resources}
          activeView={view}
          activeGroupId={activeGroupId}
          pendingCount={pending.length}
          savedCount={savedCount}
          onViewChange={handleViewChange}
        />

        <main className="min-w-0">
          {view === 'explore' ? (
            <>
              <FeedHeader variant="explore" />
              <ExploreGroups groups={allGroups} onJoin={joinGroup} onLeave={leaveGroup} />
            </>
          ) : (
            <>
              {view === 'group' && canModerateActiveGroup && activeGroup?.joined === false && (
                <div className="bg-accent-soft border border-accent/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 text-[13px] text-accent">
                  <span>Viewing this group as admin</span>
                  <button
                    type="button"
                    onClick={() => router.push('/admin')}
                    className="text-xs font-medium underline shrink-0"
                  >
                    Back to admin
                  </button>
                </div>
              )}

              {view === 'group' && activeGroup && (
                <FeedHeader
                  variant="group"
                  group={activeGroup}
                  onLeaveGroup={
                    activeGroup.joined !== false ? () => leaveGroup(activeGroup.id) : undefined
                  }
                  onAskAdmin={
                    canModerateActiveGroup ? undefined : () => setAskAdminGroup(activeGroup)
                  }
                />
              )}
              {view === 'pending' && <FeedHeader variant="pending" />}
              {view === 'yourPosts' && <FeedHeader variant="yourPosts" />}
              {view === 'saved' && <FeedHeader variant="saved" />}

              {showEvents && (
                <UpcomingEvents events={visibleEvents} calendar={calendar} showGroupTag={view === 'home'} />
              )}

              {pending.length > 0 && (view === 'home' || view === 'group') && (
                <div className="bg-pending-soft border border-pending rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-[13px]">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-pending shrink-0" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span className="flex-1 text-ink">
                    You have{' '}
                    <strong className="text-pending font-semibold">
                      {pending.length} post{pending.length === 1 ? '' : 's'}
                    </strong>{' '}
                    awaiting admin review.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleViewChange('pending')}
                    className="text-pending text-xs font-medium underline"
                  >
                    See pending
                  </button>
                </div>
              )}

              {showComposer && (
                <PostComposer
                  key={view === 'group' ? `group-${activeGroupId}` : 'home'}
                  userInitials={session.initials}
                  groups={groups}
                  fixedGroupId={view === 'group' ? activeGroupId : null}
                  onSubmit={submitPost}
                />
              )}

              {visiblePosts.length === 0 ? (
                <EmptyState view={view} />
              ) : (
                visiblePosts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    groups={sidebarGroups}
                    orgName={session.org_name}
                    showYou={view === 'pending' || view === 'yourPosts'}
                    onCancel={view === 'pending' ? cancelPendingPost : undefined}
                    onEdit={view === 'pending' ? editPendingPost : undefined}
                    onToggleReaction={view !== 'pending' ? toggleReaction : undefined}
                    onToggleSave={view !== 'pending' ? toggleSave : undefined}
                    userId={session.user_id}
                    onSignupUpdate={view !== 'pending' ? handlePostSignup : undefined}
                  />
                ))
              )}
            </>
          )}
        </main>
      </div>

      {askAdminGroup && (
        <AskAdminModal
          groupId={askAdminGroup.id}
          groupName={askAdminGroup.name}
          adminName={askAdminGroup.admin_name ?? null}
          adminUserId={askAdminGroup.admin_user_id ?? null}
          headUserId={headUserId}
          currentUserId={session.user_id}
          onClose={() => setAskAdminGroup(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ view }: { view: FeedView }) {
  const copy: Record<string, { emoji: string; title: string; body: string }> = {
    pending: {
      emoji: '✓',
      title: 'Nothing pending',
      body: 'Posts you submit will appear here while they wait for an admin to approve them.',
    },
    yourPosts: {
      emoji: '📝',
      title: 'No posts yet',
      body: 'When you share something with your groups, it will show up here.',
    },
    saved: {
      emoji: '🔖',
      title: 'Nothing saved',
      body: 'Tap Save on any post to bookmark it for later.',
    },
    group: {
      emoji: '👋',
      title: 'Welcome',
      body: 'When members of this group post, you will see it here.',
    },
    home: {
      emoji: '👋',
      title: 'Welcome',
      body: 'When members of your groups post, you will see it here.',
    },
  };
  const c = copy[view] ?? copy.home;

  return (
    <div className="bg-white border border-dashed border-line rounded-xl py-10 px-6 text-center">
      <div className="text-2xl mb-2">{c.emoji}</div>
      <h3 className="font-display text-[17px] font-medium mb-1.5">{c.title}</h3>
      <p className="text-[13px] text-ink-soft max-w-xs mx-auto leading-relaxed">{c.body}</p>
    </div>
  );
}
