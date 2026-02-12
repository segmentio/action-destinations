import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  externalId: {
    type: 'string',
    required: true,
    label: 'External ID',
    category: 'hashedPII',
    description:
      'Your company’s custom identifier for this user. This can be any unique ID, such as loyalty membership IDs, user IDs, and external cookie IDs.'
  },
  email: {
    type: 'string',
    label: 'Email',
    description: 'User’s email (ex: foo@bar.com)',
    category: 'hashedPII'
  },
  phone: {
    type: 'string',
    label: 'Phone',
    description:
      'User’s phone number, including country code. Punctuation and spaces are ok (ex: 1-234-567-8910 or +44 844 412 4653)',
    category: 'hashedPII'
  },
  country: {
    type: 'string',
    label: 'Country',
    description: 'User’s country. Use 2-letter country codes in ISO 3166-1 alpha-2 format.',
    category: 'hashedPII'
  },
  birth: {
    type: 'object',
    label: 'Date of Birth',
    description:
      'User’s date of birth. Include as many fields as possible for better match rates (ex: year = YYYY, month = MM, day = DD)',
    properties: {
      year: {
        type: 'string',
        label: 'Year'
      },
      month: {
        type: 'string',
        label: 'Month'
      },
      day: {
        type: 'string',
        label: 'Day'
      }
    },
    category: 'hashedPII'
  },
  name: {
    type: 'object',
    label: 'Name',
    description:
      'User’s name. Include as many fields as possible for better match rates. Use a-z only. No punctuation. Special characters in UTF-8 format',
    category: 'hashedPII',
    properties: {
      first: {
        type: 'string',
        label: 'First Name',
        category: 'hashedPII'
      },
      last: {
        type: 'string',
        label: 'Last Name',
        category: 'hashedPII'
      },
      firstInitial: {
        type: 'string',
        label: 'First Initial'
      }
    }
  },
  city: {
    type: 'string',
    label: 'City',
    description: 'User’s city. Use a-z only. No punctuation. No special characters.',
    category: 'hashedPII'
  },
  state: {
    type: 'string',
    label: 'State',
    description:
      'User’s state. Use the 2-character ANSI abbreviation code, Normalize states outside the US with no punctuation and no special characters.',
    category: 'hashedPII'
  },
  zip: {
    type: 'string',
    label: 'Postal Code',
    description:
      'User’s postal code. For the US, use only the first 5 digits. For the UK, use the Area/District/Sector format.',
    category: 'hashedPII'
  },
  gender: {
    type: 'string',
    label: 'Gender',
    description: 'User’s gender (m for male, f for female)',
    category: 'hashedPII'
  },
  mobileAdId: {
    type: 'string',
    label: 'Mobile Advertising ID',
    description:
      'User’s Apple IDFA, Android Ad ID, or Facebook app scoped ID. Keep hyphens (ex: AB1234CD-E123-12FG-J123)',
    category: 'hashedPII'
  },
  appId: {
    type: 'string',
    label: 'App ID',
    description: 'The app ID of the user.',
    category: 'hashedPII'
  },
  pageId: {
    type: 'string',
    label: 'Page ID',
    description: 'The page ID of the user.',
    category: 'hashedPII'
  },
  external_audience_id: {
    label: 'Facebook List ID',
    description: `The ID representing the Facebook identifier. This is the identifier that is returned during audience creation.'`,
    type: 'string',
    default: {
      '@path': '$.context.personas.external_audience_id'
    },
    unsafe_hidden: true
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'Enable batching of requests.',
    type: 'boolean',
    default: true,
    unsafe_hidden: true,
    required: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    default: 10000,
    unsafe_hidden: true,
    required: true
  }
}
