import type { FeedEvent } from '@/lib/types';
import { formatEventDay, formatEventMonth, formatEventTime } from '@/lib/format';
import { getGroupStyle } from '@/lib/group-styles';

type Props = {
  events: FeedEvent[];
  showGroupTag?: boolean;
};

export function UpcomingEvents({ events, showGroupTag = false }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="bg-white border border-line rounded-xl px-5 pt-[18px] pb-4 mb-4">
      <div className="flex justify-between items-baseline mb-3">
        <div className="font-display font-medium text-[15px] tracking-tight text-ink flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-soft" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Upcoming events
        </div>
        <div className="flex items-center gap-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-accent font-medium px-2.5 py-1 rounded-full bg-accent-soft cursor-default">
            <svg viewBox="0 0 16 16" fill="none" className="w-[13px] h-[13px]" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Add to my calendar
          </span>
          <span className="text-xs text-ink-soft font-medium cursor-default">See all →</span>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-thin">
        {events.map(event => {
          const isParish = !event.group_id;
          const style = getGroupStyle(isParish ? 'home' : (event.group_slug ?? ''));
          const groupLabel = isParish ? 'Parish-wide' : (event.group_name ?? '');

          return (
            <div
              key={event.id}
              className="flex-[0_0_240px] border border-line rounded-[10px] p-3 bg-cream-soft hover:bg-white hover:border-ink-muted hover:-translate-y-px transition-all flex gap-3 cursor-default"
            >
              <div className="shrink-0 w-11 text-center border-r border-line pr-3 flex flex-col justify-center">
                <div className="text-[10px] uppercase tracking-widest text-ink-soft font-semibold mb-0.5">
                  {formatEventMonth(event.starts_at)}
                </div>
                <div className="font-display text-[22px] font-medium leading-none text-ink">
                  {formatEventDay(event.starts_at)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">{event.title}</div>
                <div className="text-[11px] text-ink-soft mt-0.5">{formatEventTime(event.starts_at)}</div>
                {event.location && (
                  <div className="text-[11px] text-ink-muted truncate">{event.location}</div>
                )}
                {showGroupTag && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-muted mt-1">
                    <span className={`w-[7px] h-[7px] rounded-full ${style.dot}`} />
                    {groupLabel}
                  </div>
                )}
                {event.rsvped && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-success font-medium">
                    <svg viewBox="0 0 16 16" fill="none" className="w-2.5 h-2.5" aria-hidden="true">
                      <path
                        d="M3 8l3 3 7-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    You&apos;re going
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
