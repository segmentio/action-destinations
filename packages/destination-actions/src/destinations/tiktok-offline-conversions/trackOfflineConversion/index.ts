import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatEmails, formatPhones } from './formatter'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Offline Conversion',
  description: '',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      required: true,
      description:
        'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Offline Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
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
    phone_numbers: {
      label: 'Phone Numbers',
      description:
        'Phone number of the user who triggered the conversion event, in E.164 standard format, e.g. +14150000000. Segment will hash this value before sending to TikTok.',
      type: 'object',
      multiple: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    emails: {
      label: 'Emails',
      description:
        'Email address of the user who triggered the conversion event. Segment will hash this value before sending to TikTok.',
      type: 'object',
      multiple: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
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
        },
        content_name: {
          label: 'Content Name',
          description: 'Name of the product item.',
          type: 'string'
        },
        content_category: {
          label: 'Content Category',
          description: 'Category of the product item.',
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
    order_id: {
      label: 'Order ID',
      type: 'string',
      description: 'A string description of the web event.',
      default: {
        '@path': '$.properties.order_id'
      }
    },
    shop_id: {
      label: 'Shop ID',
      type: 'string',
      description: 'The text string that was searched for.',
      default: {
        '@path': '$.properties.shop_id'
      }
    },
    /**
     * Event channel. Enum values:
          email
          website
          phone_call
          in_store
          crm
          other
     */
    event_channel: {
      label: 'Event channel',
      type: 'string',
      description: 'Event channel of the offline conversion event.',
      default: {
        '@path': '$.properties.event_channel'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const userData = {
      hashedEmails: formatEmails(payload.emails),
      hashedPhoneNumbers: formatPhones(payload.phone_numbers)
    }

    let payloadUrl, urlTtclid
    if (payload.url) {
      try {
        payloadUrl = new URL(payload.url)
      } catch (error) {
        //  invalid url
      }
    }
    return request('https://business-api.tiktok.com/open_api/v1.3/offline/track/', {
      method: 'post',
      json: {
        event_set_id: settings.event_set_id,
        event: payload.event,
        event_id: payload.event_id ? `${payload.event_id}` : undefined,
        timestamp: payload.timestamp,
        context: {
          user: {
            phone_numbers: userData.hashedPhoneNumbers,
            emails: userData.hashedEmails
          }
        },
        properties: {
          order_id: payload.order_id,
          shop_id: payload.shop_id,
          contents: payload.contents,
          currency: payload.currency,
          value: payload.value,
          event_channel: payload.event_channel
        },
        partner_name: 'Segment'
      }
    })
  }
}

export default action


curl --location --request POST 'https://business-api.tiktok.com/open_api/v1.3/offline/track/' \
--header 'Access-Token: {{Access-Token}}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "event_set_id":"{{event_set_id}}", 
  "event": "CompletePayment",
  "event_id":"{{event_id}}", 
  "timestamp": "2020-09-17T19:49:27Z",     
  "context": {
    "user": {
      "phone_numbers": ["2f9d2b4df907e5c9a7b3434351b55700167b998a83dc479b825096486ffcf4ea",
      "1e7c3b4ff108e5c9a7b3434351b55700167b998a83dc479b825096486cvvf6gt"],
      "emails": ["dd6ff77f54e2106661089bae4d40cdb600979bf7edc9eb65c0942ba55c7c2d7f"]
    }
  },
  "properties": {
    "order_id": "abc_xyz", 
    "shop_id": "123abc",
    "contents": [
      {
        "price": 8,
        "quantity": 2,
        "content_type": "product",
        "content_id": "1077218",
        "content_name": "socks",
        "content_category": "Men's cloth"
      },
      {
        "price": 30,
        "quantity": 1,
        "content_type": "product",
        "content_id": "1197218",
        "content_name": "Nike Air Jordan 1",
        "content_category": "Men's shoes"
      }
    ],
    "event_channel": "in_store",
    "currency": "USD",
    "value": 46.00
  }
}
'

