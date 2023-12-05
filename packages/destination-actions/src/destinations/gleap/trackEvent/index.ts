import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const preparePayload = (payload: Payload) => {
  const event = {
    name: payload.eventName,
    date: payload.date,
    data: payload.data,
    userId: payload.userId
  }

  if (payload.type === 'page') {
    event.name = 'pageView'
    event.data = {
      page: payload.pageUrl ?? payload.eventName
    }
  } else if (payload.type === 'screen') {
    event.name = 'pageView'
    event.data = {
      page: payload.eventName
    }
  }

  return event
}

const sendEvents = async (request: any, events: any[]) => {
  return request('https://api.gleap.io/admin/track', {
    method: 'POST',
    json: {
      events: events
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Gleap.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    eventName: {
      type: 'string',
      required: false,
      description:
        'The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.',
      label: 'Event Name',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    type: {
      type: 'string',
      unsafe_hidden: true,
      required: true,
      description: 'The type of the Segment event',
      label: 'Event Type',
      choices: [
        { label: 'track', value: 'track' },
        { label: 'page', value: 'page' },
        { label: 'screen', value: 'screen' }
      ],
      default: {
        '@path': '$.type'
      }
    },
    pageUrl: {
      label: 'Event Page URL',
      description: 'The associated page url of the Segment event',
      type: 'string',
      format: 'uri',
      required: false,
      unsafe_hidden: true,
      default: { '@path': '$.context.page.url' }
    },
    date: {
      type: 'datetime',
      required: true,
      description:
        'The time the event took place in ISO 8601 format. Segment will convert to Unix before sending to Gleap.',
      label: 'Event Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    userId: {
      type: 'string',
      required: true,
      description: 'Your identifier for the user who performed the event. User ID is required.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    data: {
      type: 'object',
      description:
        'Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Gleap will ignore the rest.',
      label: 'Event Metadata',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: async (request, { payload }) => {
    const event = preparePayload(payload)
    return sendEvents(request, [event])
  },
  performBatch: async (request, { payload }) => {
    const events = payload.map(preparePayload)
    return sendEvents(request, events)
  }
}

export default action
