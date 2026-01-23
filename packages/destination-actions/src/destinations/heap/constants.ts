export const HEAP_SEGMENT_CLOUD_LIBRARY_NAME = 'cloud-mode-destination'

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
