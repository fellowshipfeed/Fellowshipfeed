'use client';

import type { FeedGroup, FeedPost } from '@/lib/types';
import { getGroupStyleFromGroup } from '@/lib/group-styles';
import { formatRelativeTime } from '@/lib/format';
import { totalReactions } from '@/lib/post-reactions';
import { GroupDot } from './GroupDot';
import { PostAttachments } from './PostAttachments';
import { PostSignupStrip } from './PostSignupStrip';

type Props = {
  post: FeedPost;
  groups: FeedGroup[];
  orgName: string;
  showYou?: boolean;
  userId?: string;
  onCancel?: (postId: string) => void;
  onToggleReaction?: (postId: string, kind: string) => void;
  onToggleSave?: (postId: string) => void;
  onSignupUpdate?: (postId: string) => void;
};

export function PostCard({
  post,
  groups,
  orgName,
  showYou = false,
  onCancel,
  onToggleReaction,
  onToggleSave,
  userId,
  onSignupUpdate,
}: Props) {
  const group = groups.find(g => g.id === post.group_id);
  const style = post.is_parish_wide
    ? getGroupStyleFromGroup({ slug: 'parish', color: 'parish' })
    : group
      ? getGroupStyleFromGroup(group)
      : getGroupStyleFromGroup({ slug: '', color: 'gray' });
  const groupLabel = post.is_parish_wide ? 'Parish-wide' : (group?.name ?? 'Group');
  const isPending = post.status === 'pending';
  const displayName = showYou ? 'You' : (post.author?.name ?? 'Unknown');
  const displayInitials = showYou ? post.author?.initials : post.author?.initials;
  const reactionTotal = totalReactions(post.reactions);
  const myReactions = new Set(post.my_reactions);

  return (
    <article
      className={`bg-white border rounded-xl px-5 py-[18px] mb-3 ${
        post.is_parish_wide
          ? 'border-accent shadow-[0_1px_0_0_#DDE6F0] border-l-4 border-l-accent'
          : isPending
            ? 'border-pending border-l-4 border-l-pending'
            : 'border-line border-l-4'
      } ${
        isPending
          ? 'bg-gradient-to-r from-pending-soft from-[0%] via-pending-soft via-[4px] to-white to-[4px]'
          : ''
      }`}
      style={
        !post.is_parish_wide && !isPending
          ? { borderLeftColor: style.hex }
          : undefined
      }
    >
      <div className={`text-[10px] uppercase tracking-[0.1em] font-semibold mb-2 flex items-center gap-1.5 ${style.eyebrow}`}>
        <GroupDot
          slug={post.is_parish_wide ? 'parish' : group?.slug}
          color={post.is_parish_wide ? 'parish' : group?.color}
          size="xs"
        />
        {groupLabel}
      </div>

      <div className="flex gap-3 items-start mb-2.5">
        <div
          className={`w-[38px] h-[38px] rounded-full font-semibold text-[13px] flex items-center justify-center shrink-0 ${
            post.is_parish_wide
              ? 'bg-gradient-to-br from-accent to-accent-hover text-white'
              : 'bg-accent-soft text-accent'
          }`}
        >
          {post.is_parish_wide ? post.author?.initials ?? getOrgInitials(orgName) : displayInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
            {post.is_parish_wide ? orgName : displayName}
            {post.author_is_admin && !isPending && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-white">
                Admin
              </span>
            )}
            {post.pinned && !isPending && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pending-soft text-pending">
                Pinned
              </span>
            )}
            {isPending && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pending-soft text-pending inline-flex items-center gap-1">
                <svg viewBox="0 0 16 16" fill="none" className="w-2 h-2" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Pending review
              </span>
            )}
          </div>
          <div className="text-xs text-ink-muted mt-0.5">
            {isPending ? `Submitted ${formatRelativeTime(post.created_at)}` : formatRelativeTime(post.created_at)}
          </div>
        </div>
      </div>

      {post.body.trim() ? (
        <p className="text-sm leading-[1.65] whitespace-pre-wrap text-ink mb-3.5">{post.body.trim()}</p>
      ) : null}

      <PostAttachments attachments={post.attachments} />

      {post.signup_config && post.status === 'approved' && userId && onSignupUpdate && (
        <PostSignupStrip
          post={post}
          userId={userId}
          onSignedUp={() => onSignupUpdate(post.id)}
        />
      )}

      {isPending && onCancel ? (
        <div className="flex items-center gap-2 pt-3 border-t border-line-soft">
          <span className="text-xs text-ink-soft flex-1">Visible only to you until a group admin approves it</span>
          <button
            type="button"
            onClick={() => onCancel(post.id)}
            className="text-xs font-medium text-red-700 hover:bg-red-50 px-2 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      ) : post.status === 'approved' ? (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-line-soft items-center">
          <ReactionButton
            active={myReactions.has('heart')}
            onClick={() => onToggleReaction?.(post.id, 'heart')}
            icon="❤️"
            count={post.reactions.heart}
          />
          <ReactionButton
            active={myReactions.has('pray')}
            onClick={() => onToggleReaction?.(post.id, 'pray')}
            icon="🙏"
            count={post.reactions.pray}
          />
          <ReactionButton
            active={myReactions.has('in')}
            onClick={() => onToggleReaction?.(post.id, 'in')}
            icon="✋"
            count={post.reactions.in}
            label="I'm in"
          />
          <ReactionButton
            active={myReactions.has('amen')}
            onClick={() => onToggleReaction?.(post.id, 'amen')}
            icon="👏"
            count={post.reactions.amen}
            label="Amen"
          />
          {reactionTotal > 0 && (
            <span className="ml-auto text-[11px] text-ink-muted">
              {reactionTotal} {reactionTotal === 1 ? 'response' : 'responses'}
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleSave?.(post.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs transition-colors ${
              reactionTotal > 0 ? 'ml-2' : 'ml-auto'
            } ${
              post.saved
                ? 'bg-accent-soft border-accent text-accent font-medium'
                : 'bg-cream-soft border-line text-ink-soft hover:border-ink-muted hover:text-ink'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill={post.saved ? 'currentColor' : 'none'} aria-hidden="true">
              <path d="M4 2h8v12l-4-3-4 3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            {post.saved ? 'Saved' : 'Save'}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function getOrgInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ReactionButton({
  active,
  onClick,
  icon,
  count,
  label,
}: {
  active: boolean;
  onClick?: () => void;
  icon: string;
  count: number;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs transition-colors ${
        active
          ? 'bg-accent-soft border-accent text-accent font-medium'
          : 'bg-cream-soft border-line text-ink-soft hover:border-ink-muted hover:text-ink'
      }`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="tabular-nums">{count}</span>
      {label && <span className="text-[11px]">{label}</span>}
    </button>
  );
}
