import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { formatEmails, formatPhones } from '../formatter'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Payment Offline Conversion',
  description: 'Send details of an in-store purchase or console purchase to the Tiktok Offline Events API',
  fields: {
    ...commonFields,
    timestamp: {
      label: 'Event Timestamp',
      type: 'string',
      description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
      default: {
        '@path': '$.timestamp'
      }
    },
    contents: {
      label: 'Contents',
      type: 'object',
      multiple: true,
      description: 'Array of product or content items for the offline event.',
      properties: {
        price: {
          label: 'Price',
          description: 'Price of the product or content item. Price is a required field for all content items.',
          type: 'number'
        },
        quantity: {
          label: 'Quantity',
          description:
            'Quantity of this product ot item in the offline event. Quantity is a required field for all content items.',
          type: 'number'
        },
        content_type: {
          label: 'Content Type',
          description: 'Product type',
          type: 'string'
        },
        content_id: {
          label: 'Content ID',
          description:
            'Product or content item identifier. Content ID is a required field for all product or content items.',
          type: 'string'
        },
        content_name: {
          label: 'Content Name',
          description: 'Name of the product or content item.',
          type: 'string'
        },
        content_category: {
          label: 'Content Category',
          description: 'Category of the product or content item.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            price: {
              '@path': 'price'
            },
            quantity: {
              '@path': 'quantity'
            },
            content_type: {
              '@path': 'type'
            },
            content_id: {
              '@path': 'product_id'
            },
            content_name: {
              '@path': 'name'
            },
            content_category: {
              '@path': 'category'
            }
          }
        ]
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
      description:
        'Revenue of total products or content items. Required for revenue reporting. Must be a number. e.g. 101.99 and not "101.99 USD"',
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
            phone_numbers: formatPhones(payload.phone_numbers),
            emails: formatEmails(payload.email_addresses)
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
