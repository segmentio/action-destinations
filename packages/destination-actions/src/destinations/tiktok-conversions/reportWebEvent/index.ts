import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { mapper } from './mapper'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Web Event',
  description: '',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'Conversion event name. Please refer to Tiktok "Web Event" section for accepted event names.',
      default: {
        '@path': '$.event'
      }
    },
    event_id: {
      label: 'Event ID',
      type: 'string',
      description: 'Any hashed ID that can identify a unique user/session.',
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Event Timestamp',
      type: 'string',
      description: 'Timestamp that the event took place. Timestamp with ISO 8601 format.'
    },
    type: {
      label: 'Event Type',
      description: 'Override event type. Ex. "page".',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const eventId = payload.event_id
      ? payload.event_id.toString() + '_' + (Math.random() + 1).toString(36).substring(7)
      : ''
    const event = mapper.mapEvents(payload)

    // Request to tiktok Events Web API
    return request('https://ads.tiktok.com/open_api/v1.2/pixel/track/', {
      method: 'post',
      headers: {
        'Access-Token': settings.accessToken,
        'content-type': 'application/json'
      },
      json: {
        pixel_code: settings.pixel_code,
        event: event,
        event_id: eventId,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
