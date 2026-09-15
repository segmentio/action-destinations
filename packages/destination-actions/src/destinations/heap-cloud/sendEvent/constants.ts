import type { NestedMode } from './types'

export const HEAP_SEGMENT_CLOUD_LIBRARY_NAME = 'cloud-mode-destination'

export const DEFAULT_NESTED_MODE: NestedMode = 'flatten'

export const NESTED_MODE_CHOICES: Array<{ label: string; value: NestedMode }> = [
  { label: 'Flatten (default)', value: 'flatten' },
  { label: 'Stringify', value: 'stringify' },
  { label: 'Drop', value: 'drop' }
]

// Value sent as the top-level `library` on the track payload.
export const HEAP_LIBRARY = 'server'

export enum HeapRegion {
  US = 'US',
  EU = 'EU'
}

export const HEAP_BASE_URLS: Record<HeapRegion, string> = {
  [HeapRegion.US]: 'https://heapanalytics.com',
  [HeapRegion.EU]: 'https://c.eu.heap-api.com'
}

export function getHeapBaseUrl(region?: string): string {
  if (region === HeapRegion.EU) {
    return HEAP_BASE_URLS[HeapRegion.EU]
  }
  return HEAP_BASE_URLS[HeapRegion.US]
}
