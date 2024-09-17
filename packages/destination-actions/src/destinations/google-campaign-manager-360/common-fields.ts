import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import { ConsentType } from './types'
import { getEntityTypeChoices, getSources } from './utils'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  floodlightConfigurationId: {
    label: 'Floodlight Configuration ID',
    description:
      'The Floodlight configuration ID associated with the conversion. Overrides the default Floodlight Configuration ID defined in Settings.',
    type: 'string',
    required: false
  },
  floodlightActivityId: {
    label: 'Floodlight Activity ID',
    description:
      'The Floodlight activity ID associated with the conversion. Overrides the default Floodlight Activity ID defined in Settings.',
    type: 'string',
    required: false
  },
  encryptionInfo: {
    label: 'Encryption Info',
    description:
      'The encryption information associated with the conversion. Required if Encrypted User ID or Encryption User ID Candidates fields are populated.',
    type: 'object',
    required: false,
    properties: {
      encryptionEntityId: {
        label: 'Encryption Entity ID',
        description:
          'The encryption entity ID. This should match the encryption type configuration for ad serving or Data Transfer.',
        type: 'string',
        required: true
      },
      encryptionEntityType: {
        label: 'Encryption Entity Type',
        description:
          'The encryption entity type. This should match the encryption type configuration for ad serving or Data Transfer.',
        type: 'string',
        required: true,
        choices: getEntityTypeChoices()
      },
      encryptionSource: {
        label: 'Encryption Source',
        description:
          'The encryption source. This should match the encryption type configuration for ad serving or Data Transfer.',
        type: 'string',
        required: true,
        choices: getSources()
      }
    }
  },
  userDetails: {
    label: 'User Details',
    description: 'User details associated with the conversion.',
    type: 'object',
    required: false,
    properties: {
      email: {
        label: 'Email',
        description: "The user's email address. If unhashed, Segment will hash before sending to Campaign Manager 360.",
        type: 'string',
        required: false
      },
      phone: {
        label: 'Phone',
        description: "The user's phone number. If unhashed, Segment will hash before sending to Campaign Manager 360.",
        type: 'string',
        required: false
      },
      firstName: {
        label: 'First Name',
        description: 'First name of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.',
        type: 'string',
        required: false
      },
      lastName: {
        label: 'Last Name',
        description: 'Last name of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.',
        type: 'string',
        required: false
      },
      streetAddress: {
        label: 'Street Address',
        description:
          'The street address of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.',
        type: 'string',
        required: false
      },
      city: {
        label: 'City',
        description: "The user's city",
        type: 'string',
        required: false
      },
      state: {
        label: 'State',
        description: "The user's state",
        type: 'string',
        required: false
      },
      postalCode: {
        label: 'Postal Code',
        description: "The user's postal code",
        type: 'string',
        required: false
      },
      countryCode: {
        label: 'Country Code',
        description: "2-letter country code in ISO-3166-1 alpha-2 of the user's address.",
        type: 'string',
        required: false
      }
    },
    default: {
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      phone: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      },
      firstName: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.context.traits.first_name' }
        }
      },
      lastName: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.context.traits.last_name' }
        }
      },
      streetAddress: {
        '@if': {
          exists: { '@path': '$.traits.address.street' },
          then: { '@path': '$.traits.address.street' },
          else: { '@path': '$.context.traits.address.street' }
        }
      },
      city: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.context.traits.address.city' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.context.traits.address.state' }
        }
      },
      postalCode: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.context.traits.address.postal_code' }
        }
      },
      countryCode: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.context.traits.address.country' }
        }
      }
    }
  },
  timestamp: {
    label: 'Timestamp (ISO-8601)',
    description: 'The timestamp of the conversion in a ISO-8601 string.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.timestamp'
    }
  },
  value: {
    label: 'Value',
    description: 'The value of the conversion.',
    type: 'number',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.total' },
        then: { '@path': '$.properties.total' },
        else: { '@path': '$.properties.revenue' }
      }
    }
  },
  quantity: {
    label: 'Quantity',
    description: 'The quantity of the conversion.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.quantity'
    }
  },
  ordinal: {
    label: 'Ordinal',
    description:
      'The ordinal of the conversion. Use this field to control how conversions of the same user and day are de-duplicated.',
    type: 'string',
    required: true
  },
  limitAdTracking: {
    label: 'Limit Ad Tracking',
    description:
      'Whether Limit Ad Tracking is enabled. When set to true, the conversion will be used for reporting but not targeting. This will prevent remarketing.',
    type: 'boolean',
    required: false,
    default: false
  },
  childDirectedTreatment: {
    label: 'Child Directed Treatment',
    description: 'Whether this particular request may come from a user under the age of 13, under COPPA compliance.',
    type: 'boolean',
    required: false,
    default: false
  },
  nonPersonalizedAd: {
    label: 'Non-Personalized Ad',
    description: 'Whether the conversion was for a non personalized ad.',
    type: 'boolean',
    required: false,
    default: true
  },
  treatmentForUnderage: {
    label: 'Treatment For Underage',
    description:
      "Whether this particular request may come from a user under the age of 16 (may differ by country), under compliance with the European Union's General Data Protection Regulation (GDPR).",
    type: 'boolean',
    required: false,
    default: false
  },
  adUserDataConsent: {
    label: 'Ad User Data Consent',
    description: 'The user data consent status for the conversion.',
    type: 'string',
    required: false,
    choices: [
      { label: ConsentType.GRANTED, value: ConsentType.GRANTED },
      { label: ConsentType.DENIED, value: ConsentType.DENIED }
    ]
  },
  merchantId: {
    label: 'Cart Data Merchant ID',
    description: 'The Merchant Center ID where the items are uploaded. Required if the cart data is provided.',
    type: 'string',
    required: false
  },
  merchantFeedLabel: {
    label: 'Cart Data Merchant Feed Label',
    description:
      'The feed labels associated with the feed where your items are uploaded. Required if the cart data is provided. For more information, please refer to https://support.google.com/merchants/answer/12453549.',
    type: 'string',
    required: false
  },
  merchantFeedLanguage: {
    label: 'Cart Data Merchant Feed Language',
    description:
      'The language associated with the feed where your items are uploaded. Use ISO 639-1 language codes. This field is needed only when item IDs are not unique across multiple Merchant Center feeds.',
    type: 'string',
    required: false
  },
  cartDataItems: {
    label: 'Cart Data Items',
    description: 'The items in the cart.',
    type: 'object',
    multiple: true,
    required: false,
    additionalProperties: false,
    properties: {
      itemId: {
        label: 'Item ID',
        description: 'The item ID associated with the conversion.',
        type: 'string',
        required: true
      },
      quantity: {
        label: 'Quantity',
        description: 'The quantity of the item.',
        type: 'number',
        required: true
      },
      unitPrice: {
        label: 'Value',
        description: 'The value of the item.',
        type: 'number',
        required: true
      }
    },
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          itemId: { '@path': '$.product_id' },
          quantity: { '@path': '$.quantity' },
          unitPrice: { '@path': '$.price' }
        }
      ]
    }
  }
}
