import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatEmail, formatPhone, formatUserId } from './formatter'

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
    },
    properties: {
      label: 'Properties associated with the event',
      description: 'Additional properties such as content info, description, and currency.',
      type: 'object',
      required: false
    },
    // PII Fields - These fields must be hashed using SHA 256 and encoded as websafe-base64.
    phone_number: {
      label: 'Phone Number',
      description: 'Phone number of the purchaser, in E.164 standard format, e.g. +14150000000',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    email: {
      label: 'Email',
      description: 'Email address of the customer who triggered the conversion event.',
      type: 'string',
      required: true,
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    external_id: {
      label: 'External ID',
      description: 'Uniquely identifies a user using Segment ID.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const eventId = payload.event_id
      ? payload.event_id.toString() + '_' + (Math.random() + 1).toString(36).substring(7)
      : ''

    const userData = {
      hashedExternalId: formatUserId(payload.external_id),
      hashedEmail: formatEmail(payload.email),
      hashedPhoneNumber: formatPhone(payload.phone_number)
    }

    // Request to tiktok Events Web API
    return request('https://business-api.tiktok.com/open_api/v1.2/pixel/track/', {
      method: 'post',
      headers: {
        'Access-Token': settings.accessToken,
        'content-type': 'application/json'
      },
      json: {
        pixel_code: settings.pixel_code,
        event: payload.event,
        event_id: eventId,
        timestamp: payload.timestamp,
        context: {
          user: {
            external_id: userData.hashedExternalId,
            phone_number: userData.hashedPhoneNumber,
            email: userData.hashedEmail
          }
        }
      }
    })
  }
}

export default action
