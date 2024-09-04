import { ActionDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

export const campaignManager360CommonFields: ActionDefinition<Settings>['fields'] = {
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
  requiredId: {
    label: 'Required ID',
    description:
      'A user identifier record the conversion against. Exactly one of Google Click ID, Display Click ID, Encrypted User ID, Mobile Device ID, Match ID or Impression ID must be provided.',
    type: 'object',
    required: true,
    properties: {
      gclid: {
        label: 'Google Click ID',
        description: 'The Google Click ID (gclid) associated with the conversion.',
        type: 'string',
        required: false
      },
      dclid: {
        label: 'Display Click ID',
        description: 'The Display Click ID (dclid) associated with the conversion.',
        type: 'string',
        required: false
      },
      encryptedUserId: {
        label: 'Encrypted User ID',
        description: 'The encrypted user ID associated with the conversion.',
        type: 'string',
        required: false
      },
      mobileDeviceId: {
        label: 'Mobile Device ID',
        description: 'The mobile device ID associated with the conversion.',
        type: 'string',
        required: false,
        default: {
          '@path': '$.context.device.id'
        }
      },
      matchId: {
        label: 'Match ID',
        description:
          'The match ID field. A match ID is your own first-party identifier that has been synced with Google using the match ID feature in Floodlight.',
        type: 'string',
        required: false
      },
      impressionId: {
        label: 'Impression ID',
        description: 'The impression ID associated with the conversion.',
        type: 'string',
        required: false
      }
    },
    default: {
      gclid: {
        '@if': {
          exists: { '@path': '$.integrations.Campaign Manager 360.gclid' },
          then: { '@path': '$.integrations.Campaign Manager 360.gclid' },
          else: { '@path': '$.properties.gclid' }
        }
      },
      dclid: {
        '@if': {
          exists: { '@path': '$.integrations.Campaign Manager 360.dclid' },
          then: { '@path': '$.integrations.Campaign Manager 360.dclid' },
          else: { '@path': '$.properties.dclid' }
        }
      },
      encryptedUserId: { '@path': '$.userId' },
      mobileDeviceId: { '@path': '$.context.device.id' },
      matchId: { '@path': '$.properties.matchId' },
      impressionId: { '@path': '$.properties.impressionId' }
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
      { label: 'Granted', value: 'GRANTED' },
      { label: 'Denied', value: 'DENIED' }
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
  },
  encryptionEntityId: {
    label: 'Encryption Entity ID',
    description:
      'The encryption entity ID. This should match the encryption type configuration for ad serving or Data Transfer.',
    type: 'string',
    required: false
  },
  encryptionEntityType: {
    label: 'Encryption Entity Type',
    description:
      'The encryption entity type. This should match the encryption type configuration for ad serving or Data Transfer.',
    type: 'string',
    required: false,
    choices: [
      { label: 'ENCRYPTION_ENTITY_TYPE_UNKNOWN', value: 'ENCRYPTION_ENTITY_TYPE_UNKNOWN' },
      { label: 'DCM_ACCOUNT', value: 'DCM_ACCOUNT' },
      { label: 'DCM_ADVERTISER', value: 'DCM_ADVERTISER' },
      { label: 'DBM_PARTNER', value: 'DBM_PARTNER' },
      { label: 'DBM_ADVERTISER', value: 'DBM_ADVERTISER' }
    ]
  },
  encryptionSource: {
    label: 'Encryption Source',
    description:
      'The encryption source. This should match the encryption type configuration for ad serving or Data Transfer.',
    type: 'string',
    required: false,
    choices: [
      { label: 'ENCRYPTION_SOURCE_UNKNOWN', value: 'ENCRYPTION_SOURCE_UNKNOWN' },
      { label: 'AD_SERVING', value: 'AD_SERVING' },
      { label: 'DATA_TRANSFER', value: 'DATA_TRANSFER' }
    ]
  }
}
