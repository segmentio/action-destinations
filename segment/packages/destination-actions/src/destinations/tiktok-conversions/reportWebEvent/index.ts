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
      required: true,
      description:
        'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
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
      description: 'Timestamp that the event took place, in ISO 8601 format.',
      default: {
        '@path': '$.timestamp'
      }
    },
    // PII Fields - These fields must be hashed using SHA 256 and encoded as websafe-base64.
    phone_number: {
      label: 'Phone Number',
      description:
        'Phone number of the user who triggered the conversion event, in E.164 standard format, e.g. +14150000000. Segment will hash this value before sending to TikTok.',
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
      description:
        'Email address of the user who triggered the conversion event. Segment will hash this value before sending to TikTok.',
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
      description:
        'Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    ttclid: {
      label: 'TikTok Click ID',
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
    },
    lead_id: {
      label: 'TikTok Lead ID',
      description:
        'ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.lead_id' },
          then: { '@path': '$.properties.lead_id' },
          else: { '@path': '$.traits.lead_id' }
        }
      }
    },
    url: {
      label: 'Page URL',
      type: 'string',
      description: 'The page URL where the conversion event took place.',
      default: {
        '@path': '$.context.page.url'
      }
    },
    referrer: {
      label: 'Page Referrer',
      type: 'string',
      description: 'The page referrer.',
      default: {
        '@path': '$.context.page.referrer'
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description: 'IP address of the browser.',
      default: {
        '@path': '$.context.ip'
      }
    },
    user_agent: {
      label: 'User Agent',
      type: 'string',
      description: 'User agent from the user’s device.',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    contents: {
      label: 'Contents',
      type: 'object',
      multiple: true,
      description: 'Related items in a web event.',
      properties: {
        price: {
          label: 'Price',
          description: 'Price of the item.',
          type: 'number'
        },
        quantity: {
          label: 'Quantity',
          description: 'Number of items.',
          type: 'number'
        },
        content_type: {
          label: 'Content Type',
          description: 'Type of the product item.',
          type: 'string'
        },
        content_id: {
          label: 'Content ID',
          description: 'ID of the product item.',
          type: 'string'
        }
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'Currency for the value specified as ISO 4217 code.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    value: {
      label: 'Value',
      type: 'number',
      description: 'Value of the order or items sold.',
      default: {
        '@if': {
          exists: { '@path': '$.properties.value' },
          then: { '@path': '$.properties.value' },
          else: { '@path': '$.properties.revenue' }
        }
      }
    },
    description: {
      label: 'Description',
      type: 'string',
      description: 'A string description of the web event.'
    },
    query: {
      label: 'Query',
      type: 'string',
      description: 'The text string that was searched for.',
      default: {
        '@path': '$.properties.query'
      }
    },
    test_event_code: {
      label: 'Test Event Code',
      type: 'string',
      description:
        'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You\'ll want to remove your Test Event Code when sending real traffic through this integration.'
    }
  },
  perform: (request, { payload, settings }) => {
    const userData = {
      hashedExternalId: formatUserId(payload.external_id),
      hashedEmail: formatEmail(payload.email),
      hashedPhoneNumber: formatPhone(payload.phone_number)
    }

    let payloadUrl, urlTtclid
    if (payload.url) {
      try {
        payloadUrl = new URL(payload.url)
      } catch (error) {
        //  invalid url
      }
    }

    if (payloadUrl) urlTtclid = payloadUrl.searchParams.get('ttclid')

    // Request to tiktok Events Web API
    return request('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
      method: 'post',
      json: {
        pixel_code: settings.pixelCode,
        event: payload.event,
        event_id: payload.event_id ? `${payload.event_id}` : undefined,
        timestamp: payload.timestamp,
        test_event_code: payload.test_event_code,
        context: {
          user: {
            external_id: userData.hashedExternalId,
            phone_number: userData.hashedPhoneNumber,
            email: userData.hashedEmail,
            lead_id: payload.lead_id
          },
          ad: {
            callback: payload.ttclid ? payload.ttclid : urlTtclid ? urlTtclid : undefined
          },
          page: {
            url: payload.url,
            referrer: payload.referrer
          },
          ip: payload.ip,
          user_agent: payload.user_agent
        },
        properties: {
          contents: payload.contents,
          currency: payload.currency,
          value: payload.value,
          description: payload.description,
          query: payload.query
        },
        partner_name: 'Segment'
      }
    })
  }
}

export default action
