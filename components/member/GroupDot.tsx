import { groupDotStyle, type GroupDotSize } from '@/lib/group-styles';

const dotPixelSizes: Record<GroupDotSize, number> = {
  xs: 7,
  sm: 8,
  md: 10,
};

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
  const px = dotPixelSizes[size];
  const dot = groupDotStyle(group, inverted);

  return (
    <span
      className={`rounded-full shrink-0 inline-block ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: dot.backgroundColor,
        boxShadow: ring ? dot.boxShadow : undefined,
      }}
      aria-hidden="true"
    />
  );
}
