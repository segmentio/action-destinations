function toTitleCase(str: string) {
  return (
    str
      // remove special characters and replace with space
      .replace(/[^a-zA-Z0-9]/g, ' ')
      // replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // split by space and title case each word
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  )
}

// Recursively capitalize all keys in an object up to two levels deep
// Array values are not modified
export function capitalizeKeys(obj: Record<string, unknown>, level = 0): Record<string, unknown> {
  if (level > 1) return obj
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        return [toTitleCase(key), capitalizeKeys(value as Record<string, unknown>, level + 1)]
      }
      if (Array.isArray(value)) {
        return [toTitleCase(key), value]
      }
      return [toTitleCase(key), value]
    })
  )
}
