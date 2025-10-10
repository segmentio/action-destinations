import { InputField } from '@segment/actions-core'
export const identifiers: InputField = {
  label: 'Subscriber Identifiers',
  description:
    'At least one identifier is required. Any identifiers sent will then become required for future updates to that Subscriber.',
  type: 'object',
  required: true,
  additionalProperties: false,
  properties: {
    ref: {
      label: 'Reference',
      description: 'A unique identifier for the Subscriber.',
      type: 'string'
    },
    email: {
      label: 'Email',
      description: 'Email address of the Subscriber.',
      type: 'string',
      format: 'email'
    }
  },
  default: {
    ref: { '@path': '$.userId' },
    email: {
      '@if': {
        exists: { '@path': '$.traits.email' },
        then: { '@path': '$.traits.email' },
        else: { '@path': '$.context.traits.email' }
      }
    }
  }
}

export const traits: InputField = {
  label: 'Traits',
  description: 'Standard traits for the Subscriber. All text fields. No specific formats for any of them.',
  type: 'object',
  required: false,
  additionalProperties: true,
  properties: {
    title: {
      label: 'Title',
      description: 'Title of the Subscriber.',
      type: 'string',
      required: false
    },
    firstname: {
      label: 'First Name',
      description: 'First name of the Subscriber.',
      type: 'string',
      required: false
    },
    lastname: {
      label: 'Last Name',
      description: 'Last name of the Subscriber.',
      type: 'string',
      required: false
    },
    dob: {
      label: 'Date of Birth',
      description: 'Date of birth of the Subscriber in ISO 8601 format (YYYY-MM-DD).',
      type: 'string',
      format: 'date',
      required: false
    },
    address: {
      label: 'Address Line 1',
      description: 'Primary address line for the Subscriber.',
      type: 'string',
      required: false
    },
    address2: {
      label: 'Address Line 2',
      description: 'Secondary address line for the Subscriber.',
      type: 'string',
      required: false
    },
    address3: {
      label: 'Address Line 3',
      description: 'Tertiary address line for the Subscriber.',
      type: 'string',
      required: false
    },
    phone: {
      label: 'Phone Number',
      description: 'Phone number of the Subscriber.',
      type: 'string',
      required: false
    },
    suburb: {
      label: 'Suburb',
      description: 'Suburb of the Subscriber.',
      type: 'string',
      required: false
    },
    state: {
      label: 'State',
      description: 'State of the Subscriber.',
      type: 'string',
      required: false
    },
    country: {
      label: 'Country',
      description: 'Country of the Subscriber.',
      type: 'string',
      required: false
    },
    postcode: {
      label: 'Postcode',
      description: 'Postcode of the Subscriber.',
      type: 'string',
      required: false
    },
    gender: {
      label: 'Gender',
      description: 'Gender of the Subscriber.',
      type: 'string',
      required: false
    }
  },
  default: {
    title: {
      '@if': {
        exists: { '@path': '$.traits.title' },
        then: { '@path': '$.traits.title' },
        else: { '@path': '$.context.traits.title' }
      }
    },
    firstname: {
      '@if': {
        exists: { '@path': '$.traits.first_name' },
        then: { '@path': '$.traits.first_name' },
        else: { '@path': '$.context.traits.first_name' }
      }
    },
    lastname: {
      '@if': {
        exists: { '@path': '$.traits.last_name' },
        then: { '@path': '$.traits.last_name' },
        else: { '@path': '$.context.traits.last_name' }
      }
    },
    dob: {
      '@if': {
        exists: { '@path': '$.traits.birthday' },
        then: { '@path': '$.traits.birthday' },
        else: { '@path': '$.context.traits.birthday' }
      }
    },
    address: {
      '@if': {
        exists: { '@path': '$.traits.street' },
        then: { '@path': '$.traits.street' },
        else: { '@path': '$.context.traits.street' }
      }
    },
    address2: {
      '@if': {
        exists: { '@path': '$.traits.address2' },
        then: { '@path': '$.traits.address2' },
        else: { '@path': '$.context.traits.address2' }
      }
    },
    address3: {
      '@if': {
        exists: { '@path': '$.traits.address3' },
        then: { '@path': '$.traits.address3' },
        else: { '@path': '$.context.traits.address3' }
      }
    },
    suburb: {
      '@if': {
        exists: { '@path': '$.traits.city' },
        then: { '@path': '$.traits.city' },
        else: { '@path': '$.context.traits.city' }
      }
    },
    state: {
      '@if': {
        exists: { '@path': '$.traits.state' },
        then: { '@path': '$.traits.state' },
        else: { '@path': '$.context.traits.state' }
      }
    },
    country: {
      '@if': {
        exists: { '@path': '$.traits.country' },
        then: { '@path': '$.traits.country' },
        else: { '@path': '$.context.traits.country' }
      }
    },
    postcode: {
      '@if': {
        exists: { '@path': '$.traits.postal_code' },
        then: { '@path': '$.traits.postal_code' },
        else: { '@path': '$.context.traits.postal_code' }
      }
    },
    phone: {
      '@if': {
        exists: { '@path': '$.traits.phone' },
        then: { '@path': '$.traits.phone' },
        else: { '@path': '$.context.traits.phone' }
      }
    },
    gender: {
      '@if': {
        exists: { '@path': '$.traits.gender' },
        then: { '@path': '$.traits.gender' },
        else: { '@path': '$.context.traits.gender' }
      }
    }
  }
}

export const timestamp: InputField = {
    label: 'Timestamp',
    description:
    'The timestamp of the event in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). Defaults to the current time if not provided.',
    type: 'string',
    format: 'date-time',
    required: true,
    default: { '@path': '$.timestamp' }
}

export const subscribeLists: InputField = {
    label: 'Lists to subscribe to',
    description: 'An array of numeric Taguchi List IDs to subscribe the Subscriber to. Leave this field empty if syncing an Audience from Engage.',
    type: 'number',
    multiple: true
}

export const unsubscribeLists: InputField = {
    label: 'Lists to unsubscribe from',
    description: 'An array of numeric Taguchi List IDs to unsubscribe the Subscriber from. Leave this field empty if syncing an Audience from Engage.',
    type: 'number',
    multiple: true
}