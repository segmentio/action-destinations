import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { HEAP_SEGMENT_LIBRARY_NAME } from '../constants'

type HeapEvent = {
  app_id: string
  identity: string
  event: string
  properties: {
    [k: string]: unknown
  }
  idempotency_key: string
  timestamp?: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Heap.',
  defaultSubscription: 'type = "track"',
  fields: {
    identity: {
      label: 'Identity',
      type: 'string',
      required: true,
      description:
        'An identity, typically corresponding to an existing user. If no such identity exists, then a new user will be created with that identity. Case-sensitive string, limited to 255 characters.',
      default: {
        '@path': '$.userId'
      }
    },
    event: {
      label: 'Event Type',
      type: 'string',
      description: 'The name of the event. Limited to 1024 characters.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the event. Each key and property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'Defaults to the current time if not provided.',
      default: {
        '@path': '$.timestamp'
      }
    },
    library_name: {
      label: 'Library Name',
      type: 'string',
      description: 'The name of the SDK used to send events',
      default: {
        '@path': '$.context.library.name'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    if (!settings.appId) {
      throw new Error('Missing app ID')
    }

    const defaultEventProperties = { segment_library: payload.library_name || HEAP_SEGMENT_LIBRARY_NAME }
    const eventProperties = Object.assign(defaultEventProperties, payload.properties ?? {})

    const event: HeapEvent = {
      app_id: settings.appId,
      identity: payload.identity,
      event: payload.event,
      properties: eventProperties,
      idempotency_key: '1' // :TODO:
    }
    if (payload.timestamp && dayjs.utc(payload.timestamp).isValid()) {
      event.timestamp = dayjs.utc(payload.timestamp).toISOString()
    }
    return request('https://heapanalytics.com/api/track', {
      method: 'post',
      json: event
    })
  }
}

export default action
