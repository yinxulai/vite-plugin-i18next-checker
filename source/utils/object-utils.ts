import type { LocaleData } from '../types'

/**
 * Flatten nested object into dot-separated key-value pairs
 * @example
 * flattenObject({ user: { name: 'John' } }) // Set(['user.name'])
 */
export function flattenObject(obj: LocaleData, prefix = ''): Set<string> {
  const keys = new Set<string>()

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenObject(value as LocaleData, fullKey)
      nested.forEach(k => keys.add(k))
    } else {
      keys.add(fullKey)
    }
  }

  return keys
}

/**
 * Remove unused keys from nested object
 * @returns Object with cleaned data and list of removed keys
 */
export function removeUnusedKeysFromObject(
  obj: LocaleData,
  usedKeys: Set<string>,
  prefix = ''
): { cleaned: LocaleData; removed: string[] } {
  const result: LocaleData = {}
  const removed: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      const nested = removeUnusedKeysFromObject(value as LocaleData, usedKeys, fullKey)
      removed.push(...nested.removed)
      
      // Only include this nested object if it has any keys left
      if (Object.keys(nested.cleaned).length > 0) {
        result[key] = nested.cleaned
      }
    } else {
      // Keep this key if it's used
      if (usedKeys.has(fullKey)) {
        result[key] = value
      } else {
        removed.push(fullKey)
      }
    }
  }

  return { cleaned: result, removed }
}
