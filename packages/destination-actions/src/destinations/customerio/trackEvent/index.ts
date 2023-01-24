import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { convertAttributeTimestamps, convertValidTimestamp, trackApiEndpoint } from '../utils'
import type { Payload } from './generated-types'

interface TrackEventPayload {
  name: string
  type?: string
  timestamp?: string | number
  data?: Record<string, unknown>
  id?: string
  // Required for anonymous events
  anonymous_id?: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track an event for a known or anonymous person.',
  defaultSubscription: 'type = "track"',
  fields: {
    id: {
      label: 'Person ID',
      description:
        'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    event_id: {
      label: 'Event ID',
      description: 'An optional identifier used to deduplicate events. [Learn more](https://customer.io/docs/api/#operation/track).',
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    data: {
      label: 'Event Attributes',
      description: 'Optional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  perform: (request, { settings, payload }) => {
    let timestamp: string | number | undefined = payload.timestamp
    let data = payload.data

    if (payload.convert_timestamp !== false) {
      if (timestamp) {
        timestamp = convertValidTimestamp(timestamp)
      }

      if (data) {
        data = convertAttributeTimestamps(data)
      }
    }

    const body: TrackEventPayload = {
      name: payload.name,
      data,
      timestamp
    }

    if (payload.event_id) {
      body.id = payload.event_id
    }

    let url: string

    if (payload.id) {
      url = `${trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.id}/events`
    } else {
      url = `${trackApiEndpoint(settings.accountRegion)}/api/v1/events`
      body.anonymous_id = payload.anonymous_id
    }

    return request(url, {
      method: 'post',
      json: body
    })
  }
}

export default action
