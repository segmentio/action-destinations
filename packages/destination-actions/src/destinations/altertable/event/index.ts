import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getNestedValue, parseContext } from '../utils'

type EventRequestPayload = {
  environment: string
  event: string
  properties: Record<string | `$${string}`, unknown>
  timestamp: string | number
  distinct_id: string | null | undefined
  anonymous_id: string | null | undefined
  device_id: string | null | undefined
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track a single event in Altertable.',
  defaultSubscription: 'type = "track"',
  fields: {
    eventType: {
      label: 'Event Type',
      description:
        'For regular analytics events, use `track`. For page views, use `page`. For mobile screens, use `screen`.',
      type: 'string',
      choices: [
        { label: 'track', value: 'track' },
        { label: 'page', value: 'page' },
        { label: 'screen', value: 'screen' }
      ],
      required: true,
      default: 'track',
      unsafe_hidden: true
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event to track',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: true
    },
    userId: {
      label: 'User ID',
      description: 'The ID of the user',
      type: 'string',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      },
      required: false
    },
    context: {
      label: 'Context',
      description: 'The context properties to send with the event',
      type: 'object',
      default: {
        '@path': '$.context'
      },
      required: false
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the event',
      type: 'object',
      required: true,
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: true
    }
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, payload)
  }
}

function send(request: RequestClient, settings: Settings, payload: Payload) {
  const contextProps = parseContext(payload.context)

  const distinctId = payload.userId || payload.anonymousId
  const anonymousId = payload.userId && payload.userId !== payload.anonymousId ? payload.anonymousId : undefined

  let event
  if (payload.eventType === 'page') {
    event = '$pageview'
  } else if (payload.eventType === 'screen') {
    event = '$screenview'
  } else {
    event = payload.event
  }

  const body: EventRequestPayload = {
    environment: settings.environment,
    event,
    properties: {
      ...contextProps,
      ...payload.properties
    },
    timestamp: payload.timestamp,
    distinct_id: distinctId,
    anonymous_id: anonymousId,
    device_id: getNestedValue(payload.context, 'device.id')
  }

  return request(`${settings.endpoint}/track`, {
    method: 'post',
    json: body
  })
}

export default action
