import type { InputField } from '@segment/actions-core'
import {
  EVENT_NAMES,
  EVENTS_REQUIRING_ITEMS,
  EVENTS_REQUIRING_VALUE,
  EVENTS_WITH_ITEMS,
  EVENTS_WITH_VALUE,
  INTEGRATION_NAME,
  MAX_BATCH_SIZE,
  PAYMENT_TYPES
} from './constants'
import type { EventName } from './constants'

const when = (events: EventName[]): NonNullable<InputField['depends_on']> => ({
  match: 'any',
  conditions: events.map((value) => ({ fieldKey: 'name', operator: 'is', value }))
})

const fromIntegrationOrProperty = (key: string, fallbackPath: string) => ({
  '@if': {
    exists: { '@path': `$.integrations.${INTEGRATION_NAME}.${key}` },
    then: { '@path': `$.integrations.${INTEGRATION_NAME}.${key}` },
    else: { '@path': fallbackPath }
  }
})

const fromPropertyOrTrait = (key: string) => ({
  '@if': {
    exists: { '@path': `$.properties.${key}` },
    then: { '@path': `$.properties.${key}` },
    else: { '@path': `$.context.traits.${key}` }
  }
})

export const name: InputField = {
  label: 'Event Name',
  description: 'The AppLovin event to send.',
  type: 'string',
  required: true,
  choices: EVENT_NAMES.map((value) => ({ label: value, value }))
}

export const event_time: InputField = {
  label: 'Event Time',
  description:
    'When the event occurred. Must be in ISO 8601 format. Segment converts it to a Unix timestamp in milliseconds before sending to AppLovin.',
  type: 'datetime',
  required: true,
  default: { '@path': '$.timestamp' }
}

export const event_source_url: InputField = {
  label: 'Event Source URL',
  description:
    'The full URL of the page where the event occurred. Include it for web events, including events sent server-side. It can be omitted for app events.',
  type: 'string',
  required: false,
  default: { '@path': '$.context.page.url' }
}

export const dedupe_id: InputField = {
  label: 'Dedupe ID',
  description:
    'A unique ID for this event. AppLovin uses it to de-duplicate this event against the same event sent by the AppLovin Pixel, so it must match the dedupe ID on the Pixel event for the same conversion.',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

export const user_data: InputField = {
  label: 'User Data',
  description:
    'User and device details used by AppLovin to match the event to a user. Required: ALEID, IP Address, User Agent, Event Source, and at least one of ALART, AXWRT, Client ID, Email, Phone or User ID. All other fields are optional. Email and phone are normalized and SHA-256 hashed before sending. ALEID, ALART and AXWRT are populated automatically by the AppLovin Conversions API Plugins destination.',
  type: 'object',
  required: true,
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    aleid: {
      label: 'ALEID',
      description:
        'Required. The aleid query parameter that AppLovin adds to your website URL after a user clicks an ad. Also stored in the _axeid cookie.',
      type: 'string',
      required: true
    },
    client_ip_address: {
      label: 'IP Address',
      description: 'Required. The public IP address of the user. IPv4 is preferred.',
      type: 'string',
      required: true
    },
    client_user_agent: {
      label: 'User Agent',
      description: 'Required. The user agent of the browser or device.',
      type: 'string',
      required: true
    },
    esi: {
      label: 'Event Source',
      description: 'Required. Where the event came from.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Web', value: 'web' },
        { label: 'App', value: 'app' }
      ]
    },
    alart: {
      label: 'ALART',
      description:
        'The alart query parameter that AppLovin adds to your URL after an ad click, used to attribute app users. Also stored in the _axart cookie. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.',
      type: 'string'
    },
    axwrt: {
      label: 'AXWRT',
      description:
        'The axwrt value set by the AppLovin Pixel, stored in the _axwrt cookie. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.',
      type: 'string'
    },
    client_id: {
      label: 'Client ID',
      description:
        'A stable first-party identifier for the user. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.',
      type: 'string'
    },
    email: {
      label: 'Email',
      description:
        "The user's email address. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.",
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description:
        "The user's phone number, including the country code. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.",
      type: 'string'
    },
    user_id: {
      label: 'User ID',
      description:
        'Your unique customer identifier. Must be at least 6 characters. Shorter values are ignored. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.',
      type: 'string'
    },
    country_code: {
      label: 'Country Code',
      description: 'The ISO 3166 billing country code.',
      type: 'string'
    },
    ifa: {
      label: 'Advertising ID',
      description: 'The IDFA or GAID of the device.',
      type: 'string'
    },
    idfv: {
      label: 'Vendor ID',
      description: 'The iOS identifier for vendor (IDFV).',
      type: 'string'
    },
    os: {
      label: 'Operating System',
      description:
        'The operating system of the device. Accepted values are ios, android, macos, windows and desktop_os. Segment values such as iOS, iPadOS, Android, macOS and Windows are converted automatically (case-insensitive); anything else is sent as desktop_os.',
      type: 'string'
    },
    sid: {
      label: 'Session ID',
      description: 'A session identifier.',
      type: 'string'
    },
    us_zip: {
      label: 'US ZIP',
      description:
        'The billing ZIP code for US users. Only the first 5 characters are sent. If both US ZIP and Non US ZIP are provided, US ZIP is used.',
      type: 'string'
    },
    non_us_zip: {
      label: 'Non US ZIP',
      description: 'The billing postal code for users outside the US. Sent as provided.',
      type: 'string'
    }
  },
  default: {
    aleid: fromIntegrationOrProperty('aleid', '$.properties.aleid'),
    alart: fromIntegrationOrProperty('alart', '$.properties.alart'),
    axwrt: fromIntegrationOrProperty('axwrt', '$.properties.axwrt'),
    client_id: { '@path': '$.anonymousId' },
    client_ip_address: { '@path': '$.context.ip' },
    client_user_agent: { '@path': '$.context.userAgent' },
    email: fromPropertyOrTrait('email'),
    esi: {
      '@if': {
        exists: { '@path': '$.context.device.type' },
        then: 'app',
        else: 'web'
      }
    },
    phone: fromPropertyOrTrait('phone'),
    user_id: { '@path': '$.userId' },
    ifa: { '@path': '$.context.device.advertisingId' },
    idfv: { '@path': '$.context.device.id' },
    os: { '@path': '$.context.os.name' }
  }
}

export const items: InputField = {
  label: 'Items',
  description:
    'The products involved in the event. Quantity is required for add_to_cart, remove_from_cart and purchase events.',
  type: 'object',
  multiple: true,
  required: when(EVENTS_REQUIRING_ITEMS),
  depends_on: when(EVENTS_WITH_ITEMS),
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    item_id: { label: 'Item ID', description: 'The ID of the item.', type: 'string', required: true },
    item_name: { label: 'Item Name', description: 'The name of the item.', type: 'string' },
    item_brand: { label: 'Item Brand', description: 'The brand of the item.', type: 'string' },
    item_variant_id: {
      label: 'Item Variant ID',
      description: 'A unique ID for the variant of the item, such as a size or color.',
      type: 'string'
    },
    item_category_id: {
      label: 'Item Category ID',
      description:
        "The numeric category ID from AppLovin's supported category list, for example 1 for Animals & Pet Supplies. Must be an integer, not a category name. See the full list: https://support.applovin.com/en/growth/promoting-your-websites/track-and-optimize/events-and-objects#category-ids",
      type: 'integer'
    },
    image_url: {
      label: 'Image URL',
      description: 'URL of an image of the item, ending in .png, .jpg or .jpeg.',
      type: 'string'
    },
    price: {
      label: 'Price',
      description: 'The unit price of the item. Use the discounted price if a discount applies.',
      type: 'number'
    },
    quantity: { label: 'Quantity', description: 'The quantity of the item.', type: 'integer' },
    discount: { label: 'Discount', description: 'The discount applied to a single unit.', type: 'number' },
    affiliation: {
      label: 'Affiliation',
      description: 'The supplier, company or store associated with the item.',
      type: 'string'
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: { '@path': '$.product_id' },
        item_name: { '@path': '$.name' },
        item_brand: { '@path': '$.brand' },
        item_variant_id: { '@path': '$.variant' },
        image_url: { '@path': '$.image_url' },
        price: { '@path': '$.price' },
        quantity: { '@path': '$.quantity' }
      }
    ]
  }
}

export const currency: InputField = {
  label: 'Currency',
  description:
    'The three-letter ISO 4217 currency code, for example USD. Required for begin_checkout, purchase and generate_lead.',
  type: 'string',
  required: when(EVENTS_REQUIRING_VALUE),
  depends_on: when(EVENTS_WITH_VALUE),
  minimum: 3,
  maximum: 3,
  default: { '@path': '$.properties.currency' }
}

export const value: InputField = {
  label: 'Value',
  description:
    'The monetary value of the event. For purchase this is the subtotal before tax and shipping. Required for begin_checkout, purchase and generate_lead.',
  type: 'number',
  required: when(EVENTS_REQUIRING_VALUE),
  depends_on: when(EVENTS_WITH_VALUE),
  default: { '@path': '$.properties.value' }
}

export const transaction_id: InputField = {
  label: 'Transaction ID',
  description: 'The unique ID of the transaction.',
  type: 'string',
  required: when(['purchase']),
  depends_on: when(['purchase']),
  default: { '@path': '$.properties.order_id' }
}

export const shipping: InputField = {
  label: 'Shipping',
  description: 'The shipping cost. Use 0 if there is none.',
  type: 'number',
  required: when(['purchase']),
  depends_on: when(['purchase']),
  default: { '@path': '$.properties.shipping' }
}

export const tax: InputField = {
  label: 'Tax',
  description: 'The tax amount. Use 0 if there is none.',
  type: 'number',
  required: when(['purchase']),
  depends_on: when(['purchase']),
  default: { '@path': '$.properties.tax' }
}

export const is_new_customer: InputField = {
  label: 'Is New Customer',
  description:
    'Whether the customer is new. Only send if you are not using the AppLovin Shopify app or uploading order history data.',
  type: 'boolean',
  required: false,
  depends_on: when(['purchase'])
}

export const payment_type: InputField = {
  label: 'Payment Type',
  description: 'The payment method used.',
  type: 'string',
  required: false,
  depends_on: when(['add_payment_info']),
  choices: PAYMENT_TYPES.map((value) => ({ label: value, value })),
  default: { '@path': '$.properties.payment_method' }
}

export const search_term: InputField = {
  label: 'Search Term',
  description: 'The term the user searched for.',
  type: 'string',
  required: when(['search']),
  depends_on: when(['search']),
  default: { '@path': '$.properties.query' }
}

export const sign_up_method: InputField = {
  label: 'Sign Up Method',
  description: 'The registration method used.',
  type: 'string',
  required: false,
  depends_on: when(['sign_up']),
  default: { '@path': '$.properties.method' }
}

export const enable_batching: InputField = {
  label: 'Batch Data',
  description: 'When enabled, Segment sends events to AppLovin in batches.',
  type: 'boolean',
  default: true,
  unsafe_hidden: false
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. AppLovin accepts up to 100 per request.',
  type: 'number',
  default: MAX_BATCH_SIZE,
  minimum: 1,
  maximum: MAX_BATCH_SIZE,
  unsafe_hidden: false
}
