export function getInitials(name: string, max = 2): string {
  return name
    .split(' ')
    .map((word: string) => word[0] ?? '')
    .join('')
    .slice(0, max)
    .toUpperCase();
}
