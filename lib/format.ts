export function getInitials(name: string, max = 2): string {
  return name
    .split(' ')
    .map((word: string) => word[0] ?? '')
    .join('')
    .slice(0, max)
    .toUpperCase();
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatEventMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

export function formatEventDay(iso: string): string {
  return String(new Date(iso).getDate());
}

export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${weekday} · ${time}`;
}
