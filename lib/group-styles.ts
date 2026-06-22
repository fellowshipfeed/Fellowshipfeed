export type GroupStyle = {
  key: string;
  hex: string;
  soft: string;
  dot: string;
  icon: string;
  eyebrow: string;
  pill: string;
  border: string;
};

type PaletteEntry = Omit<GroupStyle, 'key'>;

const palette: Record<string, PaletteEntry> = {
  'young-adult': {
    hex: '#1E7A8C',
    soft: '#D7EBF0',
    dot: 'bg-group-ya',
    icon: 'bg-group-ya-soft text-group-ya',
    eyebrow: 'text-group-ya',
    pill: 'bg-group-ya-soft text-group-ya',
    border: 'border-group-ya',
  },
  men: {
    hex: '#3F5F7A',
    soft: '#DCE3EA',
    dot: 'bg-group-men',
    icon: 'bg-group-men-soft text-group-men',
    eyebrow: 'text-group-men',
    pill: 'bg-group-men-soft text-group-men',
    border: 'border-group-men',
  },
  married: {
    hex: '#B8741A',
    soft: '#F4E6D0',
    dot: 'bg-group-married',
    icon: 'bg-group-married-soft text-group-married',
    eyebrow: 'text-group-married',
    pill: 'bg-group-married-soft text-group-married',
    border: 'border-group-married',
  },
  women: {
    hex: '#A03967',
    soft: '#F1D9E5',
    dot: 'bg-group-women',
    icon: 'bg-group-women-soft text-group-women',
    eyebrow: 'text-group-women',
    pill: 'bg-group-women-soft text-group-women',
    border: 'border-group-women',
  },
  teen: {
    hex: '#6B4E9A',
    soft: '#EAE3F5',
    dot: 'bg-group-teen',
    icon: 'bg-group-teen-soft text-group-teen',
    eyebrow: 'text-group-teen',
    pill: 'bg-group-teen-soft text-group-teen',
    border: 'border-group-teen',
  },
  seniors: {
    hex: '#5C5048',
    soft: '#E4DFD9',
    dot: 'bg-group-seniors',
    icon: 'bg-group-seniors-soft text-group-seniors',
    eyebrow: 'text-group-seniors',
    pill: 'bg-group-seniors-soft text-group-seniors',
    border: 'border-group-seniors',
  },
  parish: {
    hex: '#27476B',
    soft: '#DDE6F0',
    dot: 'bg-accent',
    icon: 'bg-accent-soft text-accent',
    eyebrow: 'text-accent',
    pill: 'bg-accent-soft text-accent',
    border: 'border-accent',
  },
  home: {
    hex: '#27476B',
    soft: '#DDE6F0',
    dot: 'bg-accent',
    icon: 'bg-accent-soft text-accent',
    eyebrow: 'text-accent',
    pill: 'bg-accent-soft text-accent',
    border: 'border-accent',
  },
  gray: {
    hex: '#6B7280',
    soft: '#E5E7EB',
    dot: 'bg-gray-500',
    icon: 'bg-gray-100 text-gray-600',
    eyebrow: 'text-gray-600',
    pill: 'bg-gray-100 text-gray-600',
    border: 'border-gray-500',
  },
};

const fallbackPalette: PaletteEntry[] = [
  {
    hex: '#2D6A4F',
    soft: '#D8F3DC',
    dot: 'bg-[#2D6A4F]',
    icon: 'bg-[#D8F3DC] text-[#2D6A4F]',
    eyebrow: 'text-[#2D6A4F]',
    pill: 'bg-[#D8F3DC] text-[#2D6A4F]',
    border: 'border-[#2D6A4F]',
  },
  {
    hex: '#9B2226',
    soft: '#FADBD8',
    dot: 'bg-[#9B2226]',
    icon: 'bg-[#FADBD8] text-[#9B2226]',
    eyebrow: 'text-[#9B2226]',
    pill: 'bg-[#FADBD8] text-[#9B2226]',
    border: 'border-[#9B2226]',
  },
  {
    hex: '#005F73',
    soft: '#CAF0F8',
    dot: 'bg-[#005F73]',
    icon: 'bg-[#CAF0F8] text-[#005F73]',
    eyebrow: 'text-[#005F73]',
    pill: 'bg-[#CAF0F8] text-[#005F73]',
    border: 'border-[#005F73]',
  },
  {
    hex: '#7B2CBF',
    soft: '#E0AAFF',
    dot: 'bg-[#7B2CBF]',
    icon: 'bg-[#E0AAFF] text-[#7B2CBF]',
    eyebrow: 'text-[#7B2CBF]',
    pill: 'bg-[#E0AAFF] text-[#7B2CBF]',
    border: 'border-[#7B2CBF]',
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function resolveGroupColorKey(slug?: string | null, color?: string | null): string {
  const candidates = [color, slug].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (palette[candidate]) return candidate;
  }
  return slug ?? color ?? 'gray';
}

export function getGroupStyle(slug?: string | null, color?: string | null): GroupStyle {
  const key = resolveGroupColorKey(slug, color);
  if (palette[key]) {
    return { key, ...palette[key] };
  }

  const fallback = fallbackPalette[hashString(key) % fallbackPalette.length];
  return { key, ...fallback };
}

export function getGroupStyleFromGroup(group: { slug: string; color?: string | null }): GroupStyle {
  return getGroupStyle(group.slug, group.color);
}

export function groupDotStyle(
  group: { slug: string; color?: string | null },
  inverted = false,
): { backgroundColor: string; boxShadow?: string } {
  const style = getGroupStyleFromGroup(group);
  if (inverted) {
    return {
      backgroundColor: '#FFFFFF',
      boxShadow: `inset 0 0 0 2px ${style.hex}`,
    };
  }
  return {
    backgroundColor: style.hex,
    boxShadow: '0 0 0 2px #FFFFFF',
  };
}

export type GroupDotSize = 'xs' | 'sm' | 'md';

export const groupDotSizes: Record<GroupDotSize, string> = {
  xs: 'w-[7px] h-[7px]',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};
