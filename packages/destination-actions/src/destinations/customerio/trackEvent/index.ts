import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { trackApiEndpoint } from '../utils'
import type { Payload } from './generated-types'

interface TrackEventPayload {
  name: string
  type?: string
  timestamp?: string | number
  data?: Record<string, any>
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
    type: {
      label: 'Event Type',
      description: 'The event type. For "page view" events, set to page.',
      type: 'string',
      default: {
        '@path': '$.type'
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
      description: 'Convert `timestamp` to a Unix timestamp (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  perform: (request, { settings, payload }) => {
    let timestamp: string | number | undefined = payload.timestamp

    if (timestamp && payload.convert_timestamp !== false) {
      timestamp = dayjs.utc(timestamp).unix()
    }

    const body: TrackEventPayload = {
      name: payload.name,
      type: payload.type,
      data: payload.data,
      timestamp
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
