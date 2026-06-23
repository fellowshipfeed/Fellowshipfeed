import type { OrgResource } from '@/lib/types';

const HIDDEN_RESOURCE_KEYS = new Set(['livestream', 'bulletin', 'contact']);

/** Always shown to members when the head has set a URL. */
export const STANDARD_PARISH_RESOURCE_KEYS = ['parish_website', 'online_giving'] as const;

type RawOrgResource = OrgResource & { enabled?: boolean };

export function buildMemberResources(resources: RawOrgResource[]): OrgResource[] {
  const standardKeys = new Set<string>(STANDARD_PARISH_RESOURCE_KEYS);
  const byKey = new Map(resources.map(r => [r.key, r]));

  const standard: OrgResource[] = STANDARD_PARISH_RESOURCE_KEYS.map(key => byKey.get(key))
    .filter((r): r is RawOrgResource => Boolean(r?.url))
    .map(r => ({ key: r.key, label: r.label, url: r.url }));

  const optional = resources
    .filter(
      r =>
        !standardKeys.has(r.key) &&
        !HIDDEN_RESOURCE_KEYS.has(r.key) &&
        r.enabled !== false &&
        Boolean(r.url),
    )
    .map(r => ({ key: r.key, label: r.label, url: r.url }));

  return [...standard, ...optional];
}

/** @deprecated use buildMemberResources */
export function filterOrgResources<T extends { key: string }>(resources: T[]): T[] {
  return resources.filter(r => !HIDDEN_RESOURCE_KEYS.has(r.key));
}
