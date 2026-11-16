import type { Payload } from './generated-types'
import { MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT, MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST } from './constants'
import type { Chunk, Entry, IndexedPayload } from './types'

function countItems(data: Entry[]): number {
  return data.reduce((sum, entry) => sum + (entry.adds?.length ?? 0) + (entry.deletes?.length ?? 0), 0)
}

function addIndex(map: Map<string, number[]>, key: string, index: number) {
  const existing = map.get(key)
  if (existing) {
    existing.push(index)
  } else {
    map.set(key, [index])
  }
}

// Returns the indexes of events whose total adds + deletes exceed MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT.
export function findOversizedIndexes(payloads: Payload[]): Set<number> {
  const oversized = new Set<number>()
  payloads.forEach((payload, index) => {
    if (countItems(payload.data) > MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT) {
      oversized.add(index)
    }
  })
  return oversized
}

// Returns the indexes of events where a profile is added to and removed from the same audience anywhere in the batch.
export function findConflictedIndexes(payloads: Payload[]): Set<number> {
  const added = new Map<string, number[]>()
  const deleted = new Map<string, number[]>()

  payloads.forEach((payload, index) => {
    payload.data.forEach((entry) => {
      entry.adds?.forEach((audienceId) => addIndex(added, JSON.stringify([entry.customerProfileId, audienceId]), index))
      entry.deletes?.forEach((audienceId) =>
        addIndex(deleted, JSON.stringify([entry.customerProfileId, audienceId]), index)
      )
    })
  })

  const conflicted = new Set<number>()
  added.forEach((addIndexes, key) => {
    const deleteIndexes = deleted.get(key)
    if (deleteIndexes) {
      addIndexes.forEach((i) => conflicted.add(i))
      deleteIndexes.forEach((i) => conflicted.add(i))
    }
  })

  return conflicted
}

// Groups events into requests of at most MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST adds + deletes, keeping each event whole.
export function buildChunks(items: IndexedPayload[]): Chunk[] {
  const chunks: Chunk[] = []
  let count = 0

  items.forEach(({ index, data }) => {
    const size = countItems(data)
    let chunk = chunks[chunks.length - 1]
    if (!chunk || count + size > MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST) {
      chunk = { data: [], indexes: [] }
      chunks.push(chunk)
      count = 0
    }
    chunk.data.push(...data)
    chunk.indexes.push(index)
    count += size
  })

  return chunks
}
