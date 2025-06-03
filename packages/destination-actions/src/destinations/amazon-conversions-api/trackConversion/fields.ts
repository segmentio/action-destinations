import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  name: {
    label: 'Event Name',
    description: 'The name of the imported event.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.event'
    }
  },
  eventType: {
    label: 'Event Type',
    description: 'The standard Amazon event type.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Add to Shopping Cart', value: 'ADD_TO_SHOPPING_CART' },
      { label: 'Application', value: 'APPLICATION' },
      { label: 'Checkout', value: 'CHECKOUT' },
      { label: 'Contact', value: 'CONTACT' },
      { label: 'Lead', value: 'LEAD' },
      { label: 'Off Amazon Purchases', value: 'OFF_AMAZON_PURCHASES' },
      { label: 'Mobile App First Start', value: 'MOBILE_APP_FIRST_START' },
      { label: 'Page View', value: 'PAGE_VIEW' },
      { label: 'Search', value: 'SEARCH' },
      { label: 'Sign Up', value: 'SIGN_UP' },
      { label: 'Subscribe', value: 'SUBSCRIBE' },
      { label: 'Other', value: 'OTHER' }
    ]
  },
  eventActionSource: {
    label: 'Event Action Source',
    description: 'The platform from which the event was sourced. If no value is provided, then website is used as default.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Android', value: 'android' },
      { label: 'Fire TV', value: 'fire_tv' },
      { label: 'iOS', value: 'ios' },
      { label: 'Offline', value: 'offline' },
      { label: 'Website', value: 'website' }
    ],
    default: {
      '@if': {
        exists: { '@path': '$.context.device.type' },
        then: { '@path': '$.context.device.type' },
        else: 'website'
      }
    }
  },
  countryCode: {
    label: 'Country Code',
    description: 'ISO 3166-1 alpha-2 country code. e.g., US, GB. Also accepts locale codes. e.g en-US, en-GB.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.context.locale'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    description: 'The reported timestamp of when the event occurred in ISO format (YYYY-MM-DDThh:mm:ssTZD).',
    type: 'string',
    required: true,
    default: {
      '@path': '$.timestamp'
    }
  },
  value: {
    label: 'Value',
    description: 'The value of the event.',
    type: 'number',
    required: false,
    default: {
      '@path': '$.properties.value'
    }
  },
  currencyCode: {
    label: 'Currency Code',
    description: 'The currencyCode associated with the \'value\' of the event in ISO-4217 format. Only applicable for OFF_AMAZON_PURCHASES event type.',
    type: 'string',
    required: false,
    depends_on: {
      conditions: [
        {
          fieldKey: 'eventType',
          operator: 'is',
          value: 'OFF_AMAZON_PURCHASES'
        }
      ]
    },
    choices: [
      { label: 'AED - UAE Dirham', value: 'AED' },
      { label: 'AUD - Australian Dollar', value: 'AUD' },
      { label: 'BRL - Brazilian Real', value: 'BRL' },
      { label: 'CAD - Canadian Dollar', value: 'CAD' },
      { label: 'CNY - Chinese Yuan', value: 'CNY' },
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'GBP - British Pound', value: 'GBP' },
      { label: 'INR - Indian Rupee', value: 'INR' },
      { label: 'JPY - Japanese Yen', value: 'JPY' },
      { label: 'MXN - Mexican Peso', value: 'MXN' },
      { label: 'SAR - Saudi Riyal', value: 'SAR' },
      { label: 'SEK - Swedish Krona', value: 'SEK' },
      { label: 'SGD - Singapore Dollar', value: 'SGD' },
      { label: 'TRY - Turkish Lira', value: 'TRY' },
      { label: 'USD - US Dollar', value: 'USD' },
      { label: 'DKK - Danish Krone', value: 'DKK' },
      { label: 'NOK - Norwegian Krone', value: 'NOK' },
      { label: 'NZD - New Zealand Dollar', value: 'NZD' }
    ],
    default: {
      '@path': '$.properties.currency'
    }
  },
  unitsSold: {
    label: 'Units Sold',
    description: 'The number of items purchased. Only applicable for OFF_AMAZON_PURCHASES event type. If not provided on the event, a default of 1 will be applied.',
    type: 'integer',
    required: false,
    depends_on: {
      conditions: [
        {
          fieldKey: 'eventType',
          operator: 'is',
          value: 'OFF_AMAZON_PURCHASES'
        }
      ]
    },
    default: {
      '@path': '$.properties.quantity'
    }
  },
  clientDedupeId: {
    label: 'Client Dedupe ID',
    description: 'The client specified id for the event. For events with the same clientDedupeId only the latest event will be kept.',
    type: 'string',
    required: false,
    default: {
      '@path': '$.messageId'
    }
  },
  matchKeys: {
    label: 'Match Keys',
    description: 'Match keys are used to identify the customer associated with the event for attribution. At least one match key must be provided.',
    type: 'object',
    required: true,
    properties: {
      email: {
        label: 'Email',
        description: 'Customer email address associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      phone: {
        label: 'Phone Number',
        description: 'Customer phone number associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      firstName: {
        label: 'First Name',
        description: 'Customer first name associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      lastName: {
        label: 'Last Name',
        description: 'Customer last name associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      address: {
        label: 'Address',
        description: 'Customer address associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      city: {
        label: 'City',
        description: 'Customer city associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      state: {
        label: 'State',
        description: 'Customer state associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      postalCode: {
        label: 'Postal Code',
        description: 'Customer postal code associated with the event.',
        type: 'string',
        required: false,
        category: 'hashedPII'
      },
      maid: {
        label: 'Mobile Ad ID',
        description: 'Mobile advertising ID (MAID). ADID, IDFA, or FIREADID can be passed into this field.',
        type: 'string',
        required: false
      },
      rampId: {
        label: 'RAMP ID',
        description: 'RAMP ID for the customer. Used for attribution to traffic events.',
        type: 'string',
        required: false
      },
      matchId: {
        label: 'Match ID',
        description: 'Match ID for the customer.',
        type: 'string',
        required: false
      }
    },
    default: {
      email: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      phone: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      },
      firstName: {
        '@if': {
          exists: { '@path': '$.context.traits.firstName' },
          then: { '@path': '$.context.traits.firstName' },
          else: { '@path': '$.properties.firstName' }
        }
      },
      lastName: {
        '@if': {
          exists: { '@path': '$.context.traits.lastName' },
          then: { '@path': '$.context.traits.lastName' },
          else: { '@path': '$.properties.lastName' }
        }
      },
      address: {
        '@if': {
          exists: { '@path': '$.context.traits.street' },
          then: { '@path': '$.context.traits.street' },
          else: { '@path': '$.properties.street' }
        }
      },
      city: {
        '@if': {
          exists: { '@path': '$.context.traits.city' },
          then: { '@path': '$.context.traits.city' },
          else: { '@path': '$.properties.city' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.context.traits.state' },
          then: { '@path': '$.context.traits.state' },
          else: { '@path': '$.properties.state' }
        }
      },
      postalCode: {
        '@if': {
          exists: { '@path': '$.context.traits.postalCode' },
          then: { '@path': '$.context.traits.postalCode' },
          else: { '@path': '$.properties.postalCode' }
        }
      },
      maid: { '@path': 'context.device.advertisingId' },
      rampId: {
        '@if': {
          exists: { '@path': '$.context.traits.rampId' },
          then: { '@path': '$.context.traits.rampId' },
          else: { '@path': '$.properties.rampId' }
        }
      },
      matchId: {
        '@if': {
          exists: { '@path': '$.context.traits.matchId' },
          then: { '@path': '$.context.traits.matchId' },
          else: { '@path': '$.properties.matchId' }
        }
      }
    }
  },
  dataProcessingOptions: {
    label: 'Data Processing Options',
    description: 'A list of flags for signaling how an event shall be processed. Events marked for limited data use will not be processed.',
    type: 'string',
    multiple: true,
    required: false,
    additionalProperties: false,
    choices: [
      { label: 'Limited Data Use', value: 'LIMITED_DATA_USE' }
    ],
    default: {
      '@path': '$.properties.dataProcessingOptions'
    }
  },
  consent: {
    label: 'Consent',
    description: 'Describes consent given by the user for advertising purposes. For EU advertisers, it is required to provide one of Geo ipAddress, amazonConsent, tcf, or gpp.',
    type: 'object',
    required: false,
    additionalProperties: false,
    properties: {
      ipAddress: {
        label: 'Geographic Consent: IP Address',
        description: "Captures the user's geographic information (IP address) for consent checking.",
        type: 'string',
        required: false
      },
      amznAdStorage: {
        label: 'Ad Storage Consent',
        description: 'Amazon Consent Format: Captures whether the user has consented to cookie based tracking.',
        type: 'string',
        required: false,
        choices: [
          { label: 'Granted', value: 'GRANTED' },
          { label: 'Denied', value: 'DENIED' }
        ]
      },
      amznUserData: {
        label: 'User Data Consent',
        description: 'Amazon Consent Format: Captures whether the user has consented to use personal data for advertising.',
        type: 'string',
        required: false,
        choices: [
          { label: 'Granted', value: 'GRANTED' },
          { label: 'Denied', value: 'DENIED' }
        ]
      },
      tcf: {
        label: 'TCF String',
        description: 'An encoded Transparency and Consent Framework (TCF) string describing user consent choices.',
        type: 'string',
        required: false
      },
      gpp: {
        label: 'GPP String',
        description: 'An encoded Global Privacy Platform (GPP) string describing user privacy preferences.',
        type: 'string',
        required: false
      }
    },
    default: {
      ipAddress: { '@path': '$.context.ip' },
      amznAdStorage: { '@path': '$.properties.amznAdStorage' },
      amznUserData: { '@path': '$.properties.amznUserData' },
      tcf: { '@path': '$.properties.tcf' },
      gpp: { '@path': '$.properties.gpp' }
    }
  },
  customAttributes: {
    label: 'Custom Attributes',
    description: 'Custom attributes associated with the event to provide additional context.',
    type: 'object',
    multiple: true,
    required: false,
    properties: {
      name: {
        label: 'Name',
        description: 'Name of the custom attribute. Only letters, numbers and the underscore character are allowed.',
        type: 'string',
        required: true
      },
      dataType: {
        label: 'Data Type',
        description: 'Data type of the custom attribute.',
        type: 'string',
        required: false,
        choices: [
          { label: 'String', value: 'STRING' },
          { label: 'Number', value: 'NUMBER' },
          { label: 'Boolean', value: 'BOOLEAN' }
        ]
      },
      value: {
        label: 'Value',
        description: 'Value of the custom attribute. Max length 256 characters.',
        type: 'string',
        required: true
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.custom_attributes',
        {
          name: { '@path': '$.name' },
          dataType: { '@path': '$.data_type' },
          value: { '@path': '$.value' }
        }
      ]
    }
  },
  amazonImpressionId: {
    label: 'Amazon impression ID',
    description: 'The Amazon impression ID associated with the event.',
    type: 'string',
    required: false,
    default: {
      '@path': '$.properties.amazonImpressionId'
    }
  },
  amazonClickId: {
    label: 'Amazon click ID',
    description: 'The Amazon click ID associated with the event.',
    type: 'string',
    required: false,
    default: {
      '@path': '$.properties.amazonClickId'
    }
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'When enabled, Segment will send data in batching.',
    type: 'boolean',
    required: true,
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    default: 500,
    unsafe_hidden: true
  }
}
