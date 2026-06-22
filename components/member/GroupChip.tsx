import { GroupDot } from './GroupDot';
import { getGroupStyleFromGroup, groupDotStyle } from '@/lib/group-styles';
import type { FeedGroup } from '@/lib/types';

type Props = {
  group: Pick<FeedGroup, 'slug' | 'color' | 'name'>;
  selected?: boolean;
  onClick?: () => void;
};

export function GroupChip({ group, selected = false, onClick }: Props) {
  const palette = getGroupStyleFromGroup(group);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
        selected
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white text-ink-soft border-line hover:border-ink-muted hover:text-ink'
      }`}
      style={
        selected
          ? { backgroundColor: palette.hex, borderColor: palette.hex }
          : undefined
      }
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={groupDotStyle(group, selected)}
        aria-hidden="true"
      />
      {group.name}
    </button>
  );
}

type LabelProps = {
  group: Pick<FeedGroup, 'slug' | 'color' | 'name'>;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
};

export function GroupLabel({ group, size = 'sm', className = '' }: LabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <GroupDot slug={group.slug} color={group.color} size={size} />
      <span className="truncate">{group.name}</span>
    </span>
  );
}
