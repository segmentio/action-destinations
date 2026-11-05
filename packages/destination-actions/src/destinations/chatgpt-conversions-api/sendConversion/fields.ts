import type { InputField } from '@segment/actions-core'
import {
  ACTION_SOURCE_IS_WEB,
  ACTION_SOURCE_LABELS,
  AMOUNT_IS_PRESENT,
  CITY_MAX_LENGTH,
  COUNTRY_LENGTH,
  CURRENCY_LENGTH,
  CUSTOM_EVENT_NAME_MAX_LENGTH,
  CUSTOM_EVENT_NAME_MIN_LENGTH,
  EVENT_TYPE_IS_CUSTOM,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_SUPPORTS_CONTENTS,
  EVENT_TYPE_SUPPORTS_PLAN_ID,
  GAID_LENGTH,
  MAX_BATCH_SIZE,
  POSTAL_CODE_MAX_LENGTH,
  REGION_MAX_LENGTH
} from '../constants'

const toChoices = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ label, value }))

export const fields: Record<string, InputField> = {
  event_type: {
    label: 'Event Type',
    description: 'The ChatGPT Conversions API event type to send. Custom events also require a Custom Event Name.',
    type: 'string',
    required: true,
    choices: toChoices(EVENT_TYPE_LABELS)
  },
  custom_event_name: {
    label: 'Custom Event Name',
    description:
      'The name of the custom event. Letters, digits, underscores and hyphens only, starting and ending with a letter or digit. It is lowercased, and must not match a standard event type.',
    type: 'string',
    required: EVENT_TYPE_IS_CUSTOM,
    depends_on: EVENT_TYPE_IS_CUSTOM,
    minimum: CUSTOM_EVENT_NAME_MIN_LENGTH,
    maximum: CUSTOM_EVENT_NAME_MAX_LENGTH
  },
  event_id: {
    label: 'Event ID',
    description:
      'A unique ID for the event, used for deduplication. Reuse the Measurement Pixel event ID so browser and server events are deduplicated, and so retries are not counted twice.',
    type: 'string',
    required: true,
    default: { '@path': '$.messageId' }
  },
  timestamp: {
    label: 'Timestamp',
    description:
      'When the event occurred. ChatGPT Conversions API rejects events more than 7 days old or more than 10 minutes in the future.',
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
  },
  action_source: {
    label: 'Action Source',
    description:
      'Where the conversion happened. Defaults to Web when the event has a page URL, otherwise Other. App Installed and App Opened events must use Mobile App.',
    type: 'string',
    required: true,
    choices: toChoices(ACTION_SOURCE_LABELS),
    default: {
      '@if': {
        exists: { '@path': '$.context.page.url' },
        then: 'web',
        else: 'other'
      }
    }
  },
  source_url: {
    label: 'Source URL',
    description: 'The URL of the page where the event occurred, including scheme and host. Required for Web events.',
    type: 'string',
    required: ACTION_SOURCE_IS_WEB,
    depends_on: ACTION_SOURCE_IS_WEB,
    default: { '@path': '$.context.page.url' }
  },
  oppref: {
    label: 'OpenAI Click Reference',
    description:
      'The oppref click ID from the landing page URL. It is sent unchanged. The ChatGPT Conversions API browser plugin captures it in the browser and adds it to every later event.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.integrations.ChatGPT Conversions API.oppref' },
        then: { '@path': '$.integrations.ChatGPT Conversions API.oppref' },
        else: { '@path': '$.properties.oppref' }
      }
    }
  },
  opt_out: {
    label: 'Opt Out',
    description: 'When true, opts the user out of future user-level personalization.',
    type: 'boolean'
  },
  amount: {
    label: 'Amount',
    description:
      'The total value of the event. Provide it as a decimal number in the currency major unit, for example 100.05 for $100.05. Segment converts it to integer minor units (cents) before sending to ChatGPT Conversions API, so 100.05 USD is sent as 10005. Do not pre-convert it to minor units.',
    type: 'number'
  },
  currency: {
    label: 'Currency',
    description: 'The ISO 4217 currency code of the amount, for example USD. Required when an amount is mapped.',
    type: 'string',
    required: AMOUNT_IS_PRESENT,
    depends_on: AMOUNT_IS_PRESENT,
    minimum: CURRENCY_LENGTH,
    maximum: CURRENCY_LENGTH,
    default: { '@path': '$.properties.currency' }
  },
  plan_id: {
    label: 'Plan ID',
    description: 'The ID of the plan for subscription, trial and custom events.',
    type: 'string',
    depends_on: EVENT_TYPE_SUPPORTS_PLAN_ID,
    default: { '@path': '$.properties.plan_id' }
  },
  contents: {
    label: 'Contents',
    description:
      'The items involved in the event. Not available for appointment, lead, registration and app events. Item amounts are per unit. Any additional keys you add to an item, such as size or color, are sent to ChatGPT Conversions API as variant attributes, and their values are converted to strings. Do not use id, group_id, name, content_type, quantity, amount or currency as variant keys.',
    type: 'object',
    multiple: true,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue',
    depends_on: EVENT_TYPE_SUPPORTS_CONTENTS,
    properties: {
      id: { label: 'Item ID', description: 'Your internal ID for the item.', type: 'string' },
      group_id: { label: 'Group ID', description: 'The product group or category ID of the item.', type: 'string' },
      name: { label: 'Name', description: 'A human readable name for the item.', type: 'string' },
      content_type: {
        label: 'Content Type',
        description: 'A category for the item, for example product, plan or page.',
        type: 'string'
      },
      quantity: { label: 'Quantity', description: 'The number of units. Sent as an integer.', type: 'integer' },
      amount: {
        label: 'Amount',
        description:
          'The price of one unit. Provide it as a decimal number in the currency major unit, for example 19.99 for $19.99. Segment converts it to integer minor units (cents) before sending to ChatGPT Conversions API, so 19.99 USD is sent as 1999.',
        type: 'number'
      },
      currency: {
        label: 'Currency',
        description: 'The ISO 4217 currency code of the item amount. Defaults to the event currency.',
        type: 'string',
        minimum: CURRENCY_LENGTH,
        maximum: CURRENCY_LENGTH
      }
    }
  },
  essential_identifiers: {
    label: 'Essential Identifiers',
    description: 'At least one essential identifier is required.',
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description:
          "The user's email addresses, up to 3, for example jane@example.com. Segment trims each one, lowercases it and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is. Any values after the first 3 are ignored.",
        type: 'string',
        multiple: true
      },
      phone: {
        label: 'Phone',
        description:
          "The user's phone numbers with country code, up to 3, for example +14155550123 (8 to 15 digits). Segment removes spaces, brackets, dots, dashes and a leading + or zeros from each one, then SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is. Any values after the first 3 are ignored.",
        type: 'string',
        multiple: true
      },
      android_advertising_id: {
        label: 'Android Advertising ID',
        description:
          "The user's Android Google Advertising ID (GAID) as a 36 character UUID, for example 123e4567-e89b-12d3-a456-426614174000. Sent unhashed. IDFA is not supported.",
        type: 'string',
        minimum: GAID_LENGTH,
        maximum: GAID_LENGTH
      }
    },
    default: {
      email: [
        {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      ],
      phone: [
        {
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        }
      ],
      android_advertising_id: {
        '@if': {
          blank: {
            '@liquid':
              "{% if context.device.advertisingId and context.device.type == 'android' %}{{ context.device.advertisingId }}{% endif %}"
          },
          then: { '@path': '$.context.device.advertisingId' }
        }
      }
    }
  },
  matching_data: {
    label: 'Matching Data',
    description:
      'Optional identifiers and user details that help ChatGPT Conversions API match the event to a user. They work best when sent together.',
    type: 'object',
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      obref: {
        label: 'OpenAI Browser Reference',
        description:
          "The user's OpenAI browser reference (obref) value. Sent unhashed. The ChatGPT Conversions API browser plugin reads it from the __obref cookie, which requires the user's measurement consent. Falls back to the anonymous ID.",
        type: 'string'
      },
      external_id: {
        label: 'External ID',
        description:
          'Your own ID for the user, for example a user ID. Segment trims it and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.',
        type: 'string'
      },
      user_agent: {
        label: 'User Agent',
        description: "The user's browser user agent string. Sent unhashed.",
        type: 'string'
      },
      ip_address: {
        label: 'IP Address',
        description:
          "The user's IPv4 or IPv6 address, for example 203.0.113.7. Sent unhashed. An invalid address causes the event to be rejected.",
        type: 'string'
      },
      first_name: {
        label: 'First Name',
        description:
          "The user's first name. Segment lowercases it, removes spaces and punctuation, and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.",
        type: 'string'
      },
      last_name: {
        label: 'Last Name',
        description:
          "The user's last name. Segment lowercases it, removes spaces and punctuation, and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.",
        type: 'string'
      },
      city: {
        label: 'City',
        description: "The user's city as plain text, for example San Francisco. Sent unhashed. Maximum 128 characters.",
        type: 'string',
        maximum: CITY_MAX_LENGTH
      },
      region: {
        label: 'Region',
        description:
          "The user's state or region as plain text, for example California or CA. Sent unhashed. Maximum 128 characters.",
        type: 'string',
        maximum: REGION_MAX_LENGTH
      },
      country: {
        label: 'Country',
        description:
          "The user's two letter ISO 3166-1 alpha-2 country code, for example US. Sent unhashed. An unrecognized code causes the event to be rejected.",
        type: 'string',
        minimum: COUNTRY_LENGTH,
        maximum: COUNTRY_LENGTH
      },
      postal_code: {
        label: 'Postal Code',
        description:
          "The user's postal or ZIP code as plain text, for example 94105. Sent unhashed. Maximum 32 characters.",
        type: 'string',
        maximum: POSTAL_CODE_MAX_LENGTH
      }
    },
    default: {
      obref: {
        '@if': {
          exists: { '@path': '$.integrations.ChatGPT Conversions API.obref' },
          then: { '@path': '$.integrations.ChatGPT Conversions API.obref' },
          else: { '@path': '$.anonymousId' }
        }
      },
      external_id: { '@path': '$.userId' },
      user_agent: { '@path': '$.context.userAgent' },
      ip_address: { '@path': '$.context.ip' },
      first_name: {
        '@if': {
          exists: { '@path': '$.context.traits.first_name' },
          then: { '@path': '$.context.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      },
      last_name: {
        '@if': {
          exists: { '@path': '$.context.traits.last_name' },
          then: { '@path': '$.context.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      },
      city: { '@path': '$.context.traits.address.city' },
      region: { '@path': '$.context.traits.address.state' },
      country: { '@path': '$.context.traits.address.country' },
      postal_code: { '@path': '$.context.traits.address.postalCode' }
    }
  },
  enable_batching: {
    label: 'Batch Data to ChatGPT Conversions API',
    description: 'When enabled, Segment sends events to ChatGPT Conversions API in batches.',
    type: 'boolean',
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'The maximum number of events to send in each batch.',
    type: 'number',
    unsafe_hidden: true,
    default: MAX_BATCH_SIZE,
    minimum: 1,
    maximum: MAX_BATCH_SIZE
  }
}
