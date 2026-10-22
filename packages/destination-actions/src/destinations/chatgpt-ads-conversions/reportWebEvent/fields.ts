import type { InputField } from '@segment/actions-core'
import { EVENT_DATA_TYPES, GEO_LIST_FIELDS, HASH_LIST_FIELDS } from '../constants'

const text = (label: string, description: string): InputField => ({ label, description, type: 'string' })

const userProperties: Record<string, InputField> = {
  email_sha256: text('Email SHA-256', 'A lowercase, 64-character SHA-256 hash of the trimmed, lowercase email.'),
  external_id_sha256: text(
    'External ID SHA-256',
    'A lowercase, 64-character SHA-256 hash of the customer ID, trimmed at both ends with case preserved.'
  ),
  ip_address: text('IP Address', 'The customer IP address from the original event. Do not use the server IP.'),
  user_agent: text('User Agent', 'The customer browser user agent from the original event.'),
  obref: text('Browser Reference', 'The existing OpenAI browser reference. Pass the value unchanged.'),
  country: text('Country', 'Two-letter country code.'),
  city: text('City', 'Customer city.')
}

for (const name of HASH_LIST_FIELDS) {
  userProperties[name] = {
    ...text(name, 'Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.'),
    multiple: true
  }
}
for (const name of GEO_LIST_FIELDS) {
  userProperties[name] = { ...text(name, 'Up to three customer geographic values.'), multiple: true }
}

export const fields: Record<string, InputField> = {
  event_type: {
    ...text('Event Type', 'The ChatGPT Ads website event to send. Select custom for an advertiser-defined event.'),
    required: true,
    choices: Object.keys(EVENT_DATA_TYPES).map((value) => ({ value, label: value }))
  },
  event_id: {
    ...text(
      'Event ID',
      'A stable ID for this event. Reuse it on retries and in Pixel when sending the same conversion.'
    ),
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.event_id' },
        then: { '@path': '$.properties.event_id' },
        else: { '@path': '$.messageId' }
      }
    }
  },
  timestamp: {
    label: 'Event Time',
    description:
      'Original event time as an ISO 8601 timestamp with timezone, or integer Unix milliseconds. Do not use the delivery time.',
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
  },
  source_url: {
    ...text(
      'Page URL',
      'The website URL where the event occurred. Credentials, query parameters and fragments are removed. Map a path without personal data.'
    ),
    required: true,
    default: { '@path': '$.context.page.url' }
  },
  custom_event_name: text(
    'Custom Event Name',
    'Required for custom events. Use 1–64 letters, numbers, underscores or hyphens, starting and ending with a letter or number.'
  ),
  opt_out: {
    label: 'Opt Out',
    description:
      'Map the advertiser opt-out signal: true, false, or null/absent for unspecified. This does not replace consent-based routing in Segment.',
    type: 'boolean',
    allowNull: true,
    default: { '@path': '$.properties.opt_out' }
  },
  oppref: {
    ...text('Ad Click Reference', 'The existing OpenAI ad click reference. Pass the value unchanged.'),
    default: { '@path': '$.properties.oppref' }
  },
  amount: {
    label: 'Value',
    description:
      'Event value. By default, use major currency units: 42.50 for USD 42.50. Set Amount Units to minor if the source already sends cents.',
    type: 'number',
    default: { '@path': '$.properties.revenue' }
  },
  amount_units: {
    ...text(
      'Amount Units',
      'Applies to both the event value and item unit prices. Major converts using the currency; minor requires integers.'
    ),
    choices: [
      { label: 'Major (for example, USD dollars)', value: 'major' },
      { label: 'Minor (for example, USD cents)', value: 'minor' }
    ],
    default: 'major'
  },
  currency: {
    ...text('Currency', 'ISO 4217 currency code, such as USD. Required when Value is present.'),
    default: { '@path': '$.properties.currency' }
  },
  plan_id: {
    ...text('Plan ID', 'Optional plan ID for subscription, trial, or custom events.'),
    default: { '@path': '$.properties.plan_id' }
  },
  contents: {
    label: 'Items',
    description:
      'Products or content for commerce, page, subscription, trial, or custom events. Item price is a unit price, not a line total.',
    type: 'object',
    multiple: true,
    additionalProperties: false,
    properties: {
      id: text('Item ID', 'Product or content ID.'),
      group_id: text('Group ID', 'Product group ID.'),
      name: text('Name', 'Product or content name.'),
      content_type: text('Content Type', 'Product or content type.'),
      quantity: { label: 'Quantity', description: 'Number of units.', type: 'integer' },
      amount: { label: 'Unit Price', description: 'Price per item in the selected Amount Units.', type: 'number' },
      currency: text('Item Currency', 'ISO 4217 currency. Defaults to the event currency when absent.'),
      variant_dict: {
        label: 'Variants',
        description: 'Variant names and string values, such as color: blue.',
        type: 'object',
        additionalProperties: true
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          id: { '@path': '$.product_id' },
          name: { '@path': '$.name' },
          quantity: { '@path': '$.quantity' },
          amount: { '@path': '$.price' },
          currency: { '@path': '$.currency' }
        }
      ]
    }
  },
  email: {
    ...text(
      'Email',
      'Optional raw email. The connector trims, lowercases and hashes it before sending. Do not map an already hashed value here.'
    ),
    default: { '@path': '$.context.traits.email' }
  },
  external_id: {
    ...text(
      'Customer ID',
      'Optional customer ID. The connector trims both ends, preserves case and hashes it before sending. Do not map an already hashed value here.'
    ),
    default: { '@path': '$.userId' }
  },
  user_data: {
    label: 'Matching Data',
    description:
      'Optional customer matching fields. Identity hashes must be prepared upstream. Use only data permitted by your consent rules.',
    type: 'object',
    additionalProperties: false,
    properties: userProperties,
    default: { '@path': '$.properties.user_data' }
  },
  custom_properties: {
    label: 'Custom Properties',
    description:
      'Explicitly selected properties for custom events only. Do not include personal data or credentials here.',
    type: 'object',
    additionalProperties: true
  }
}
