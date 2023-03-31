import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Payment Offline Conversion',
  description: 'Send details of an in-store purchase or console purchase to the Tiktok Offline Conversions API',
  fields: {
    ...commonFields,
    timestamp: {
      label: 'Event Timestamp',
      type: 'string',
      description: 'Timestamp that the event took place. Timestamp with ISO-8601 format.',
      default: {
        '@path': '$.timestamp'
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
          description: 'Price of the product or content. Price is a required field for all content items.',
          type: 'number'
        },
        quantity: {
          label: 'Quantity',
          description: 'Number of item. Quantity is a required field for all content items.',
          type: 'number'
        },
        content_type: {
          label: 'Content Type',
          description: 'Type of the product item.',
          type: 'string'
        },
        content_id: {
          label: 'Content ID',
          description: 'Product or content identifier. Content ID is a required field for all content items.',
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
      required: true,
      description:
        'ISO 4217 code. Required for revenue reporting. Example: "USD".List of currencies currently supported: AED, ARS, AUD, BDT, BHD, BIF, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, DZD, EGP, EUR, GBP, GTQ, HKD, HNL, HUF, IDR, ILS, INR, ISK, JPY, KES, KHR, KRW, KWD, KZT, MAD, MOP, MXN, MYR, NGN, NIO, NOK, NZD, OMR, PEN, PHP, PHP, PKR, PLN, PYG, QAR, RON, RUB, SAR, SEK, SGD, THB, TRY, TWD, UAH, USD, VES, VND, ZAR.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    value: {
      label: 'Value',
      type: 'number',
      required: true,
      description: 'Revenue of total contents. Required for revenue reporting.',
      default: {
        '@if': {
          exists: { '@path': '$.properties.value' },
          then: { '@path': '$.properties.value' },
          else: { '@path': '$.properties.revenue' }
        }
      }
    }
  },
  perform: (request, { payload, settings }) => {
    return request('https://business-api.tiktok.com/open_api/v1.3/offline/track/', {
      method: 'post',
      json: {
        event_set_id: settings.eventSetID,
        event: payload.event,
        event_id: payload.event_id ? `${payload.event_id}` : undefined,
        timestamp: payload.timestamp,
        context: {
          user: {
            phone_numbers: [], //userData.hashedPhoneNumbers,
            emails: [] //userData.hashedEmails
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
