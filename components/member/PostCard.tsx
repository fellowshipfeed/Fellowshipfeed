import type { FeedGroup, FeedPost } from '@/lib/types';
import { getGroupStyle } from '@/lib/group-styles';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function PostCard({ post, groups }: { post: FeedPost; groups: FeedGroup[] }) {
  const group = groups.find(g => g.id === post.group_id);
  const style = post.is_parish_wide ? getGroupStyle('home') : getGroupStyle(group?.slug ?? '');
  const groupLabel = post.is_parish_wide ? 'Parish-wide' : group?.name ?? 'Group';

  return (
    <article
      className={`bg-white border border-line rounded-xl p-5 mb-3 ${
        post.is_parish_wide ? 'border-accent shadow-[0_1px_0_0_#DDE6F0]' : ''
      } ${post.status === 'pending' ? 'border-pending bg-gradient-to-r from-pending-soft from-[0%] via-pending-soft via-[4px] to-white to-[4%]' : ''}`}
    >
      <div className={`text-[10px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5 ${style.eyebrow}`}>
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        {groupLabel}
      </div>
      <div className="flex gap-3 items-start mb-2.5">
        <div
          className={`w-9 h-9 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 ${
            post.is_parish_wide ? 'bg-gradient-to-br from-accent to-accent-hover text-white' : 'bg-accent-soft text-accent'
          }`}
        >
          {post.author?.initials}
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
            {post.author?.name ?? 'Unknown'}
            {post.status === 'pending' && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pending-soft text-pending">
                Pending
              </span>
            )}
          </div>
          <div className="text-xs text-ink-muted mt-0.5">{formatTime(post.created_at)}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink mb-3">{post.body}</p>
      {post.status === 'approved' && (
        <div className="flex gap-5 pt-3 border-t border-line-soft text-xs text-ink-soft">
          <button type="button" className="flex items-center gap-1.5 hover:text-ink" disabled>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 8c0-2.5 2-4.5 4-4.5s4 2 4 4.5c0 2.5-4 6.5-4 6.5S4 10.5 4 8z" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Like
          </button>
          <button type="button" className="flex items-center gap-1.5 hover:text-ink" disabled>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 2h8v12l-4-3-4 3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            Save
          </button>
        </div>
      )}
    </article>
  );
}
