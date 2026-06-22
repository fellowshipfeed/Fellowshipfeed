const HIDDEN_RESOURCE_KEYS = new Set(['livestream', 'bulletin', 'contact']);

export function filterOrgResources<T extends { key: string }>(resources: T[]): T[] {
  return resources.filter(r => !HIDDEN_RESOURCE_KEYS.has(r.key));
}
