import { InputField } from '@segment/actions-core/destination-kit/types'

/* Common Fields
  * The following fields are included for all event types(actions)
  */
export const EVENT_ID: InputField = {
  label: 'Event ID',
  description: 'Unique ID generated by the client to suppress duplicate events. The length should not exceed 128 characters.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.messageId'
  }
}

export const TIMESTAMP: InputField = {
  label: 'Timestamp',
  description: 'Timestamp that the event happened at.',
  type: 'datetime',
  required: true,
  // could set a default value to '$.timestamp' but did not do so
  // because Segment could be sending the time when the message was sent
  // instead of when the event actually happened
}

export const CHANNEL_TYPE: InputField = {
  label: 'Channel Type',
  description: 'Type of channel, either APP or SITE',
  type: 'string',
  required: true,
  choices: [
    { label: 'App', value: 'APP' },
    { label: 'Site', value: 'SITE' }
  ]
}

export const USER_ID: InputField = {
  label: 'User ID',
  description: 'User Identifier for the platform. Recommended to hash it before sending for anonymization. The length should not exceed 128 characters.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.userId'
  }
}

export const DEVICE: InputField = {
  label: 'Device',
  description: `Device information of the event`,
  type: 'object',
  required: false,
  properties: {
    os: {
      label: 'OS',
      description: 'OS of the device. "ios" or "android" must be included for the APP channel type.',
      type: 'string',
      required: false,
    },
    osVersion: {
      label: 'OS Version',
      description: 'Device OS version, which is taken from the device without manipulation or normalization. (e.g., "14.4.1")',
      type: 'string',
      required: false,
    },
    advertisingId: {
      label: 'Advertising ID',
      description: 'For app traffic, IDFA of iOS or ADID of android should be filled in this field. (e.g., 7acefbed-d1f6-4e4e-aa26-74e93dd017e4)',
      type: 'string',
      required: false,
    },
    uniqueDeviceId: {
      label: 'Unique Device ID',
      description: `For app traffic, a unique identifier for the device being used should be provided in this field.
  Clients can issue identifiers for their user devices or use their IDFV values if using iOS apps.
  The length of this id should not exceed 128 characters.`,
      type: 'string',
      required: false,
    },
    model: {
      label: 'Model',
      description: 'Device model, which is taken from the device without manipulation or normalization. (e.g., "iPhone 11 Pro")',
      type: 'string',
      required: false,
    },
    ua: {
      label: 'User Agent',
      description: 'User Agent. (e.g., "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF")',
      type: 'string',
      required: false,
    },
    language: {
      label: 'Language',
      description: 'ISO-639-1 alpha-2 language code. (e.g., "en")',
      type: 'string',
      required: false
    },
    ip: {
      label: 'IP Address',
      description: 'IP in IPv4 format. (e.g., 216.212.237.213)',
      type: 'string',
      required: false,
    }
  },
  default: {
    os: { '@path': '$.context.os.name' },
    osVersion: { '@path': '$.context.os.version' },
    advertisingId: { '@path': '$.context.device.advertisingId' },
    uniqueDeviceId: { '@path': '$.context.device.id' },
    model: { '@path': '$.context.device.model' },
    ua: { '@path': '$.context.userAgent' },
    ip: { '@path': '$.context.ip' }
  }
}

export const SESSION_ID: InputField = {
  label: 'Session ID',
  description: 'Identifier for tracking users regardless of sign-in status. The length should not exceed 128 characters.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.anonymousId'
  }
}

export const DEFAULT_CURRENCY: InputField = {
  label: 'Default Currency',
  description: `The default currency value. If this is set, it will be used as a default currency value for items.
  Available options are the followings
  UNKNOWN_CURRENCY: Unknown currency.
  USD: US Dollar.
  KRW: Korean Won.
  JPY: Japanese Yen.
  EUR: EU Euro.
  GBP: British Pound.
  SEK: Swedish Krona.
  INR: India Rupee.
  THB: Thailand Baht.
  IDR: Indonesia Rupiah.
  CNY: China Yuan.
  CAD: Canada Dollar.
  RUB: Russia Ruble.
  BRL: Brazil Real.
  SGD: Singapore Dollar.
  HKD: Hong Kong Dollar.
  AUD: Autrailia Dollar.
  PLN: Poland Zloty.
  DKK: Denmark Krone.
  VND: Viet Nam Dong.
  MYR: Malaysia Ringgit.
  PHP: Philippines Peso.
  TRY: Turkey Lira.
  VEF: Venezuela Bolívar.`,
  type: 'string',
  required: false
}

/* Variable Fields
  * The following fields may be included/excluded or have different label/description depending on the event type(action)
  * Due to its variance, each fields are defined as a function that returns InputField
  */
function createMoneyProperties(required: boolean): Record<string, InputField> {
  return {
    price: {
      label: 'Price',
      description:
        'Monetary amount without currency. (e.g., 12.34 for $12.34 if currency is "USD")'
        + (required ? '' : ', REQUIRED IF CURRENCY IS GIVEN'),
      type: 'number',
      required: required
    },
    currency: {
      label: 'Currency',
      description: 'Currency information'
      + (required ? '' : ', REQUIRED IF PRICE IS GIVEN)')
      + ` Available options are the followings
  UNKNOWN_CURRENCY: Unknown currency.
  USD: US Dollar.
  KRW: Korean Won.
  JPY: Japanese Yen.
  EUR: EU Euro.
  GBP: British Pound.
  SEK: Swedish Krona.
  INR: India Rupee.
  THB: Thailand Baht.
  IDR: Indonesia Rupiah.
  CNY: China Yuan.
  CAD: Canada Dollar.
  RUB: Russia Ruble.
  BRL: Brazil Real.
  SGD: Singapore Dollar.
  HKD: Hong Kong Dollar.
  AUD: Autrailia Dollar.
  PLN: Poland Zloty.
  DKK: Denmark Krone.
  VND: Viet Nam Dong.
  MYR: Malaysia Ringgit.
  PHP: Philippines Peso.
  TRY: Turkey Lira.
  VEF: Venezuela Bolívar.`,
      type: 'string',
      required: required,
    }
  }
}

export function createItemsInputField(required: boolean): InputField {
  return {
    label: 'Items',
    description: 'Item information list related to the event.',
    type: 'object',
    required: required,
    multiple: true,
    properties: {
      id: {
        label: 'ID',
        description: 'Unique identifier of the Item.',
        type: 'string',
        required: true
      },
      ...createMoneyProperties(false),
      quantity: {
        label: 'Quantity',
        description: 'Quantity of the item. Recommended.',
        type: 'number',
        required: false
      },
      sellerId: {
        label: 'Seller ID',
        description: 'Unique identifier of the Seller.',
        type: 'string',
        required: false
      }
    }
  }
}

export function createRevenueInputField(required: boolean): InputField {
  return {
    label: 'Revenue',
    description: 'Revenue of the event',
    type: 'object',
    required: required,
    properties: createMoneyProperties(true),
  }
}

export function createSearchQueryInputField(required: boolean): InputField {
  return {
    label: 'Search Query',
    description: 'Query string for the search.',
    type: 'string',
    required: required
  }
}

// args is an object with a single property, requireIdentification
// This is to differentiate this function's parameter effect from the other create*InputField functions
// This function's parameter does not explicitly require the field to be required, but rather only changes the description
// It's requirement will be checked from the Moloco RMP's side
export function createPageIdInputField(args: { requireIdentification: boolean }): InputField {
  const { requireIdentification } = args

  return {
    label: 'Page ID',
    description: `A string that can identify a context of the event,
  such as "electronics", "categories/12312", "azd911d" or "/classes/foo/lectures/bar.
  Any value is acceptable if it helps identifying unique pages.`
    + (requireIdentification ? ', (At least one of page_id or page_identifier_tokens is required)':  ''),
    type: 'string',
    required: false,
    default: {
      '@path': '$.context.page.path'
    }
  }
}

// args is an object with a single property, requireIdentification
// This is to differentiate this function's parameter effect from the other create*InputField functions
// This function's parameter does not explicitly require the field to be required, but rather only changes the description
// It's requirement will be checked from the Moloco RMP's side
export function createPageIdentifierTokensInputField(args: { requireIdentification: boolean }): InputField {
  const { requireIdentification } = args

  return {
    label: 'Page Identifier Tokens',
    description: 'Tokens that can be used to identify a page. Alternative to page_id with a lower priority.'
    + (requireIdentification ? ', (At least one of page_id or page_identifier_tokens is required)':  ''),
    type: 'object',
    required: false
  }
}

export function createReferrerPageIdInputField(required: boolean): InputField {
  return {
    label: 'Referrer Page ID',
    description: `Similar to referrer in HTTP, this value indicates from which page the user came to the current page.`,
    type: 'string',
    required: required,
    default: {
      '@path': '$.context.page.referrer'
    }
  }
}

export function createShippingChargeInputField(required: boolean): InputField {
  return {
    label: 'Shipping Charge',
    description: 'Shipping charge’s monetary amount in a specific currency.',
    type: 'object',
    required: required,
    properties: createMoneyProperties(true),
  }
}