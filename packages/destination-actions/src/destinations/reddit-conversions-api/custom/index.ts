import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom',
  description: "Send Segment events to Reddit Conversions API's Custom event.",
  fields: {
    event_at: {
      label: 'Event At',
      description: 'The RFC3339 timestamp when the conversion event occurred',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    event_type: {
      label: 'Event Type',
      description: 'The type of the event',
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        custom_event_name: {
          label: 'Custom Event Name',
          description:
            'A custom event name that can be passed when tracking_type is set to "Custom". All UTF-8 characters are accepted and custom_event_name must be at most 64 characters long.',
          type: 'string',
          required: false
        },
        tracking_type: {
          label: 'Custom Event Name',
          description:
            'Enum: "PageVisit" "ViewContent" "Search" "AddToCart" "AddToWishlist" "Purchase" "Lead" "SignUp" "Custom". One of the standard tracking types',
          type: 'string',
          required: false,
          choices: [
            { label: 'Page Visit', value: 'PageVisit' },
            { label: 'View Content', value: 'ViewContent' },
            { label: 'Search', value: 'Search' },
            { label: 'Add to Cart', value: 'AddToCart' },
            { label: 'Add to Wishlist', value: 'AddToWishlist' },
            { label: 'Purchase', value: 'Purchase' },
            { label: 'Lead', value: 'Lead' },
            { label: 'Sign Up', value: 'SignUp' },
            { label: 'Custom', value: 'Custom' }
          ]
        }
      }
    },
    click_id: {
      label: 'Click ID',
      description: 'The Reddit-generated id associated with a single ad click.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.integrations.Reddit Conversions Api.click_id' },
          then: { '@path': '$.integgrations.Reddit Conversions Api.click_id' },
          else: { '@path': '$.properties.click_id' }
        }
      }
    },
    event_metadata: {
      label: 'Event Metadata',
      description:
        'The metadata associated with the conversion event. Only one of "value" or "value_decimal" should be included.',
      type: 'object',
      required: false,
      properties: {
        currency: {
          label: 'Currency',
          description:
            'The currency for the value provided. This must be a three-character ISO 4217 currency code. This should only be set for revenue-related events.',
          type: 'string'
        },
        item_count: {
          label: 'Item Count',
          description: 'The number of items in the event. This should only be set for revenue-related events.',
          type: 'integer'
        },
        value_decimal: {
          label: 'Value Decimal',
          description:
            'The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.',
          type: 'number'
        }
      },
      default: {
        currency: {
          '@path': '$.properties.currency'
        },
        item_count: {
          '@path': '$.properties.quantity'
        },
        value_decimal: {
          '@path': '$.properties.total'
        }
      }
    },
    products: {
      label: 'Products',
      description: 'The products associated with the conversion event.',
      type: 'object',
      required: false,
      multiple: true,
      properties: {
        category: {
          label: 'Category',
          description: "The category the product is in; for example, a label from Google's product taxonomy. Required.",
          type: 'string',
          required: true
        },
        id: {
          label: 'Product ID',
          description: 'The ID representing the product in a catalog. Required.',
          type: 'string',
          required: true
        },
        name: {
          label: 'Product Name',
          description: 'The name of the product. Optional.',
          type: 'string',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            category: { '@path': '$.category' },
            id: { '@path': '$.product_id' },
            name: { '@path': '$.name' }
          }
        ]
      }
    },
    user: {
      label: 'User',
      description: 'The identifying user parameters associated with the conversion event.',
      type: 'object',
      required: true,
      properties: {
        advertising_id: {
          label: 'Advertising ID',
          description: 'The mobile advertising ID for the user. This can be the iOS IDFA, Android AAID.',
          type: 'string'
        },
        device_type: {
          label: 'Device Type',
          description: 'The type of mobile device. e.g. iOS or Android.',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'The email address of the user.',
          type: 'string'
        },
        external_id: {
          label: 'External ID',
          description: 'An advertiser-assigned persistent identifier for the user.',
          type: 'string'
        },
        ip_address: {
          label: 'IP Address',
          description: 'The IP address of the user.',
          type: 'string'
        },
        opt_out: {
          label: 'Opt Out',
          description: 'A flag indicating whether the user has opted out of tracking.',
          type: 'boolean'
        },
        user_agent: {
          label: 'User Agent',
          description: "The user agent of the user's browser.",
          type: 'string'
        },
        uuid: {
          label: 'UUID',
          description:
            "The value from the first-party Pixel '_rdt_uuid' cookie on your domain. Note that it is in the '{timestamp}.{uuid}' format. You may use the full value or just the UUID portion.",
          type: 'string'
        }
      },
      default: {
        advertising_id: { '@path': '$.context.device.advertisingId' },
        device_type: { '@path': '$.context.device.type' },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        external_id: {
          '@if': {
            exists: { '@path': '$.userId' },
            then: { '@path': '$.userId' },
            else: { '@path': '$.anonymousId' }
          }
        },
        ip_address: { '@path': '$.context.ip' },
        opt_out: { '@path': '$.properties.opt_out' },
        user_agent: { '@path': '$.context.userAgent' },
        uuid: {
          '@if': {
            exists: { '@path': '$.integrations.Reddit Conversions Api.uuid' },
            then: { '@path': '$.integgrations.Reddit Conversions Api.uuid' },
            else: { '@path': '$.properties.uuid' }
          }
        }
      }
    },
    data_processing_options: {
      label: 'Data Processing Options',
      description: 'A structure of data processing options to specify the processing type for the event.',
      type: 'object',
      required: false,
      additionalProperties: false,
      properties: {
        country: {
          label: 'Country',
          description: 'Country Code of the user. We support ISO 3166-1 alpha-2 country code.',
          type: 'string'
        },
        modes: {
          label: 'Modes',
          description:
            'Comma delimited list of Data Processing Modes for this conversion event. Currently we only support LDU (Limited Data Use).',
          type: 'string',
          choices: [{ label: 'Limited Data Use', value: 'LDU' }]
        },
        region: {
          label: 'Region',
          description:
            'Region Code of the user. We support ISO 3166-2 region code or just the region code without country prefix, e.g. CA.',
          type: 'string'
        }
      }
    },
    screen_dimensions: {
      label: 'Screen Dimensions',
      description: "The dimensions of the user's screen.",
      type: 'object',
      additionalProperties: false,
      properties: {
        height: {
          label: 'Height',
          description: "The height of the user's screen in pixels. This must be positive and less than 32768.",
          type: 'integer'
        },
        width: {
          label: 'Width',
          description: "The width of the user's screen in pixels. This must be positive and less than 32768.",
          type: 'integer'
        }
      }
    }
  },

  ////ADD CONVERSION_ID FIELD

  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  const data = createRedditPayload(payload)
  return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: {
      data: data
    }
  })
}

function createRedditPayload(payload: Payload) {
  const advertisingIdKey = payload.user.device_type === 'Apple' ? 'idfa' : 'aaid'
  const cleanedPayload = {
    event_at: payload.event_at,
    event_type: {
      tracking_type: payload.event_type.tracking_type, //FORCE IT TO CUSTOM
      custom_event_name: payload.event_type.custom_event_name //THIS IS THE NAME THEY WILL CHOOSE
    },
    click_id: payload.click_id,
    // NOTE: ADD CONVERSION ID WITHIN EVENT METADATA AFTER WE IMPLEMENT THE JS PIXEL
    event_metadata: payload.event_metadata
      ? cleanObject({
          currency: payload.event_metadata.currency,
          item_count: payload.event_metadata.item_count,
          value_decimal: payload.event_metadata.value_decimal,
          products: payload.products
            ? payload.products.map((product) =>
                cleanObject({
                  category: product.category,
                  id: product.id,
                  name: product.name
                })
              )
            : undefined
        })
      : undefined,
    user: cleanObject({
      [advertisingIdKey]: payload.user.advertising_id,
      email: payload.user.email,
      external_id: payload.user.external_id,
      ip_address: payload.user.ip_address,
      opt_out: payload.user.opt_out,
      user_agent: payload.user.user_agent,
      uuid: payload.user.uuid,
      data_processing_options: payload.data_processing_options
        ? cleanObject({
            country: payload.data_processing_options.country,
            modes: payload.data_processing_options.modes,
            region: payload.data_processing_options.region
          })
        : undefined,
      screen_dimensions: payload.screen_dimensions
        ? cleanObject({
            height: payload.screen_dimensions.height,
            width: payload.screen_dimensions.width
          })
        : undefined
    })
  }

  return { events: cleanObject(cleanedPayload) }
}

function cleanObject(obj: object): object {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value != null))
}

export default action
