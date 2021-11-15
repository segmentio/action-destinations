import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'

function serializeEvent(event: Payload) {
  return {
    ...event,
    // convert the timestamp into rfc3999 format. We use dayjs because Segmemt promises
    //   "By using the datetime type, you can be sure that that timestamp value passed
    //    to your perform method will be a valid datetime value that will be parsable by dayjs.
    // We use dayjs.utc mostly to help ensure consistent test cases. "dayjs("2021-01-01").toISOString()"
    // will otherwise use the local time offset, which leads to inconsistent tests. It's not required
    // for the Metronome API, in fact just doing new Date(event.timestamp).toISOString() should work just
    // fine here.
    //
    // Ideally Segment would just pass any date-time values as Date objects not have this loose
    // coupling to dayjs parse formats but, this is fine for now.
    timestamp: dayjs.utc(event.timestamp).toISOString(),
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send an event to Metronome',
  fields: {
    transaction_id: {
      type: 'string',
      label: 'transaction_id',
      description: 'The Metronome transaction ID uniquely identifies an event to ensure Metronome only processes each event once.',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    customer_id: {
      type: 'string',
      label: 'customer_id',
      description: 'The Metronome customer ID or ingest alias this event should be associated with.',
      required: true,
      default: {
        // By default, use the group ID if it exists, otherwise use the user ID. If neither exist, use the anonymous ID.
        '@if': {
          exists: { '@path': '$.context.groupId' },
          then: { '@path': '$.context.groupId' },
          else: {
            '@if': {
              exists: { '@path': '$.userId' },
              then: { '@path': '$.userId' },
              else: { '@path': '$.anonymousId' }
            }
          }
        }
      }
    },
    timestamp: {
      type: 'datetime',
      label: 'timestamp',
      description: 'The timestamp at which this event occurred.',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    event_type: {
      type: 'string',
      label: 'event_type',
      description: 'The Metronome event_type.',
      required: true,
    },
    properties: {
      type: 'object',
      label: 'properties',
      description: 'The Metronome properties object.',
      required: true,
    },
  },
  perform: (request, { payload }) => {
    // Auth is injected by extendRequest in the destination root
    return request('https://api.getmetronome.com/v1/ingest', {
      method: 'post',
      json: [
        serializeEvent(payload)
      ]
    })
  },
  // We'd like to be able to use performBatch, but we run into complexity when 1 event in the batch
  // fails validation, causing the entire batch to fail. We've decided to just send 1 event at a time
  // for now, which allows normal 4XX and 5XX semantics to be used and bubble errors up into the Segment
  // UI. We can revisit this as needed.
  //
  // performBatch: (request, { payload }) => {},
}

export default action
