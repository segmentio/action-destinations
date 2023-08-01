import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPhone } from './formatter'
import { TikTokPixel } from '../types'

const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Report Web Event',
  description:
    'Report events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      required: true,
      description:
        'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Pixel documentation](https://ads.tiktok.com/marketing_api/docs?id=1739585696931842) for accepted event names.'
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
      description: 'A string description of the web event.',
      default: {
        '@path': '$.properties.description'
      }
    },
    query: {
      label: 'Query',
      type: 'string',
      description: 'The text string that was searched for.',
      default: {
        '@path': '$.properties.query'
      }
    }
  },
  perform: (ttq, { payload }) => {
    if (payload.email || payload.phone_number) {
      ttq.identify({
        email: payload.email,
        phone_number: formatPhone(payload.phone_number)
      })
    }

    ttq.track(payload.event, {
      contents: payload.contents ? payload.contents : [],
      currency: payload.currency ? payload.currency : 'USD', // default to 'USD'
      value: payload.value ? payload.value : 0, //default to 0
      description: payload.description,
      query: payload.query
    })
  }
}

export default action
