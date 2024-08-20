import { InputField } from '@segment/actions-core/destination-kit/types'
import { createHash } from 'crypto'
import { Payload } from './addToCart/generated-types'

export const event_at: InputField = {
  label: 'Event At',
  description: 'The RFC3339 timestamp when the conversion event occurred',
  type: 'datetime',
  required: true,
  default: {
    '@path': '$.timestamp'
  }
}

export const event_type: InputField = {
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
      label: 'Tracking Type',
      description:
        'Enum: "PageVisit" "ViewContent" "Search" "AddToCart" "AddToWishlist" "Purchase" "Lead" "SignUp" "Custom". One of the standard tracking types',
      type: 'string',
      required: true,
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
}

export const click_id: InputField = {
  label: 'Click ID',
  description: 'The Reddit-generated id associated with a single ad click.',
  type: 'string',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.integrations.Reddit Conversions Api.click_id' },
      then: { '@path': '$.integrations.Reddit Conversions Api.click_id' },
      else: { '@path': '$.properties.click_id' }
    }
  }
}

export const event_metadata: InputField = {
  label: 'Event Metadata',
  description: 'The metadata associated with the conversion event.',
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
}

export const products: InputField = {
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
}

export const user: InputField = {
  label: 'User',
  description: 'The identifying user parameters associated with the conversion event.',
  type: 'object',
  required: false,
  properties: {
    advertising_id: {
      label: 'Advertising ID', // NEEDS TO BE HASHED (SHA-256)
      description: 'The mobile advertising ID for the user. This can be the iOS IDFA, Android AAID.',
      type: 'string'
    },
    device_type: {
      label: 'Device Type',
      description: 'The type of mobile device. e.g. iOS or Android.',
      type: 'string'
    },
    email: {
      label: 'Email', // NEEDS TO BE HASHED (SHA-256)
      description: 'The email address of the user.',
      type: 'string'
    },
    external_id: {
      label: 'External ID', // NEEDS TO BE HASHED (SHA-256)
      description: 'An advertiser-assigned persistent identifier for the user.',
      type: 'string'
    },
    ip_address: {
      label: 'IP Address', // NEEDS TO BE HASHED (SHA-256)
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
        then: { '@path': '$.integrations.Reddit Conversions Api.uuid' },
        else: { '@path': '$.properties.uuid' }
      }
    }
  }
}

export const data_processing_options: InputField = {
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
        'Region Code of the user. We support ISO 3166-2 region code, ex: "US-CA, US-NY, etc." or just the region code without country prefix, e.g. "CA, NY, etc.".',
      type: 'string'
    }
  }
}

export const screen_dimensions: InputField = {
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

//CREATE CONVERSION_ID FIELD

const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export const hashedUserData = (user: Payload['user']) => {
  const hashedUser = { ...user }

  if (hashedUser.email) {
    hashedUser.email = hash(hashedUser.email.toLowerCase().replace(/\s/g, ''))
  }
  if (hashedUser.advertising_id) {
    hashedUser.advertising_id = hash(hashedUser.advertising_id)
  }
  if (hashedUser.external_id) {
    hashedUser.external_id = hash(hashedUser.external_id)
  }
  if (hashedUser.ip_address) {
    hashedUser.ip_address = hash(hashedUser.ip_address)
  }

  return hashedUser
}
