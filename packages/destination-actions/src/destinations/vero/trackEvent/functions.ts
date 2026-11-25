import { PayloadValidationError } from '@segment/actions-core'
import { MAX_EVENT_NAME_LENGTH } from '../constants'
import { resolveIdentity, stringifyRecord, toISODate, trim } from '../functions'
import type { Payload } from './generated-types'
import type { TrackJSON } from './types'

export function buildJSON(payload: Payload): TrackJSON {
  const { userId, email, eventName, properties, deduplicationValue, createdAt } = payload

  const identity = resolveIdentity(userId, email)

  const name = trim(eventName)
  if (!name) {
    throw new PayloadValidationError('Event Name is required.')
  }
  if (name.length > MAX_EVENT_NAME_LENGTH) {
    throw new PayloadValidationError(`Event Name must be less than ${MAX_EVENT_NAME_LENGTH} characters.`)
  }

  const dedupValue = trim(deduplicationValue)
  const timestamp = toISODate(createdAt)

  const json: TrackJSON = {
    identity,
    event_name: name,
    data: {
      ...stringifyRecord(properties),
      ...(dedupValue ? { segment_event_id: dedupValue } : {})
    },
    extras: {
      source: 'Segment',
      ...(timestamp ? { created_at: timestamp } : {})
    }
  }

  return json
}
