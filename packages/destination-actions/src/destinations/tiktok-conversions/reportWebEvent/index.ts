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
    ttp: {
      label: 'TikTok Cookie ID',
      description:
        'TikTok Cookie ID. If you also use Pixel SDK and have enabled cookies, Pixel SDK automatically saves a unique identifier in the `_ttp` cookie. The value of `_ttp` is used to match website visitor events with TikTok ads. You can extract the value of `_ttp` and attach the value here. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](https://ads.tiktok.com/marketing_api/docs?id=%201771100936446977) (`_ttp`).',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.ttp' },
          then: { '@path': '$.properties.ttp' },
          else: { '@path': '$.traits.ttp' }
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
    locale: {
      label: 'Locale',
      description:
        'The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.locale' },
          then: { '@path': '$.properties.locale' },
          else: { '@path': '$.traits.locale' }
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
        content_category: {
          label: 'Content Category',
          description: 'Category of the product item.',
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
        brand: {
          label: 'Brand',
          description: 'Brand name of the product item.',
          type: 'string'
        }
      }
    },
    content_type: {
      label: 'Content Type',
      description:
        'Type of the product item. When the `content_id` in the `contents` parameter is specified as `sku_id`, set this field to `product`. When the `content_id` in the `contents` parameter is specified as `item_group_id`, set this field to `product_group`.',
      type: 'string',
      choices: ['product', 'product_group']
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
    order_id: {
      label: 'Order ID',
      type: 'string',
      description: 'Order ID of the transaction.',
      default: {
        '@path': '$.properties.order_id'
      }
    },
    shop_id: {
      label: 'Shop ID',
      type: 'string',
      description: 'Shop ID of the transaction.',
      default: {
        '@path': '$.properties.shop_id'
      }
    },
    limited_data_use: {
      label: 'Limited Data Use',
      type: 'string',
      description:
        'Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).',
      default: {
        '@path': '$.properties.limited_data_use'
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
    return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'post',
      json: {
        event_source: 'web',
        event_source_id: settings.pixelCode,
        partner_name: 'Segment',
        data: [
          {
            event: payload.event,
            event_time: payload.timestamp
              ? Math.floor(new Date(payload.timestamp).getTime() / 1000)
              : Math.floor(new Date().getTime() / 1000),
            event_id: payload.event_id ? `${payload.event_id}` : undefined,
            user: {
              ttclid: payload.ttclid ? payload.ttclid : urlTtclid ? urlTtclid : undefined,
              external_id: userData.hashedExternalId,
              phone_number: userData.hashedPhoneNumber,
              email: userData.hashedEmail,
              lead_id: payload.lead_id ? payload.lead_id : undefined,
              ttp: payload.ttp ? payload.ttp : undefined,
              ip: payload.ip ? payload.ip : undefined,
              user_agent: payload.user_agent ? payload.user_agent : undefined,
              locale: payload.locale ? payload.locale : undefined
            },
            properties: {
              contents: payload.contents ? payload.contents : [],
              content_type: payload.content_type ? payload.content_type : undefined,
              currency: payload.currency ? payload.currency : undefined,
              value: payload.value ? payload.value : undefined,
              query: payload.query ? payload.query : undefined,
              description: payload.description ? payload.description : undefined,
              order_id: payload.order_id ? payload.order_id : undefined,
              shop_id: payload.shop_id ? payload.shop_id : undefined
            },
            page: {
              url: payload.url ? payload.url : undefined,
              referrer: payload.referrer ? payload.referrer : undefined
            },
            limited_data_use: payload.limited_data_use ? payload.limited_data_use : false,
            test_event_code: payload.test_event_code ? payload.test_event_code : undefined
          }
        ]
      }
    })
  }
}

export default action
