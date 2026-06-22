export type GroupStyle = {
  dot: string;
  icon: string;
  eyebrow: string;
  pill: string;
};

const styles: Record<string, GroupStyle> = {
  'young-adult': {
    dot: 'bg-group-ya',
    icon: 'bg-group-ya-soft text-group-ya',
    eyebrow: 'text-group-ya',
    pill: 'bg-group-ya-soft text-group-ya',
  },
  men: {
    dot: 'bg-group-men',
    icon: 'bg-group-men-soft text-group-men',
    eyebrow: 'text-group-men',
    pill: 'bg-group-men-soft text-group-men',
  },
  married: {
    dot: 'bg-group-married',
    icon: 'bg-group-married-soft text-group-married',
    eyebrow: 'text-group-married',
    pill: 'bg-group-married-soft text-group-married',
  },
  women: {
    dot: 'bg-group-women',
    icon: 'bg-group-women-soft text-group-women',
    eyebrow: 'text-group-women',
    pill: 'bg-group-women-soft text-group-women',
  },
  teen: {
    dot: 'bg-group-teen',
    icon: 'bg-group-teen-soft text-group-teen',
    eyebrow: 'text-group-teen',
    pill: 'bg-group-teen-soft text-group-teen',
  },
  seniors: {
    dot: 'bg-group-seniors',
    icon: 'bg-group-seniors-soft text-group-seniors',
    eyebrow: 'text-group-seniors',
    pill: 'bg-group-seniors-soft text-group-seniors',
  },
};

const defaultStyle: GroupStyle = {
  dot: 'bg-accent',
  icon: 'bg-accent-soft text-accent',
  eyebrow: 'text-accent',
  pill: 'bg-accent-soft text-accent',
};

export function getGroupStyle(slug: string): GroupStyle {
  return styles[slug] ?? defaultStyle;
}
