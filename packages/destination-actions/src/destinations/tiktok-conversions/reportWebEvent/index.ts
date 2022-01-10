import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatEmail, formatPhone, formatUserId } from './formatter'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Web Event',
  description:
    'Report events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description:
        'Conversion event name. Please refer to the "Supported Web Events" section on this [page](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.',
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
      description: 'Timestamp that the event took place, in ISO 8601 format.'
    },
    type: {
      label: 'Segment Event Type',
      description: 'The Segment event type, e.g. "page".',
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
      description:
        'Phone number of the user who triggered the conversion event, in E.164 standard format, e.g. +14150000000.',
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
      description: 'Email address of the user who triggered the conversion event.',
      type: 'string',
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
      description: 'Uniquely identifies the user who triggered the conversion event.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    ttclid: {
      label: 'TikTok Click  ID',
      description:
        'The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.ttclid' },
          then: { '@path': '$.properties.ttclid' },
          else: { '@path': '$.traits.ttclid' }
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
      hashedEmail: formatEmail(payload.email || ''),
      hashedPhoneNumber: formatPhone(payload.phone_number)
    }

    // Request to tiktok Events Web API
    return request('https://business-api.tiktok.com/open_api/v1.2/pixel/track/', {
      method: 'post',
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
          },
          ad: {
            callback: payload.ttclid
          }
        }
      }
    })
  }
}

export default action
