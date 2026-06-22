import { groupDotSizes, groupDotStyle, type GroupDotSize } from '@/lib/group-styles';

type Props = {
  slug?: string | null;
  color?: string | null;
  size?: GroupDotSize;
  ring?: boolean;
  inverted?: boolean;
  className?: string;
};

export function GroupDot({
  slug,
  color,
  size = 'sm',
  ring = true,
  inverted = false,
  className = '',
}: Props) {
  const group = { slug: slug ?? '', color };
  const sizeClass = groupDotSizes[size];
  const dot = groupDotStyle(group, inverted);

  return (
    <span
      className={`rounded-full shrink-0 inline-block ${sizeClass} ${className}`}
      style={{
        backgroundColor: dot.backgroundColor,
        boxShadow: ring ? dot.boxShadow : undefined,
      }}
      aria-hidden="true"
    />
  );
}
