import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateUpdateConversionPayloads } from './functions'
import { refreshGoogleAccessToken } from '../common-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Adjustment Upload',
  description: "Inserts a conversion into Campaign Manager 360's profile configured under Settings.",
  fields: {
    floodlightConfigurationId: {
      label: 'Floodlight Configuration ID',
      description:
        'The Floodlight configuration ID associated with the conversion. Overrides the default Floodlight Configuration ID defined in Settings.',
      type: 'string',
      required: false,
      dynamic: true
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
          description: 'The email address associated with the conversion.',
          type: 'string',
          required: false
        },
        phone: {
          label: 'Phone',
          description: 'The phone number associated with the conversion.',
          type: 'string',
          required: false
        },
        firstName: {
          label: 'First Name',
          description: 'The first name associated with the conversion.',
          type: 'string',
          required: false
        },
        lastName: {
          label: 'Last Name',
          description: 'The last name associated with the conversion.',
          type: 'string',
          required: false
        },
        streetAddress: {
          label: 'Street Address',
          description: 'The street address associated with the conversion.',
          type: 'string',
          required: false
        },
        city: {
          label: 'City',
          description: 'The city associated with the conversion.',
          type: 'string',
          required: false
        },
        state: {
          label: 'State',
          description: 'The state associated with the conversion.',
          type: 'string',
          required: false
        },
        postalCode: {
          label: 'Postal Code',
          description: 'The postal code associated with the conversion.',
          type: 'string',
          required: false
        },
        countryCode: {
          label: 'Country Code',
          description: 'The country code associated with the conversion.',
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
    gclid: {
      label: 'Google Click ID',
      description: 'The Google Click ID (gclid) associated with the conversion.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.integrations.Campaign Manager 360.gclid' },
          then: { '@path': '$.integrations.Campaign Manager 360.gclid' },
          else: { '@path': '$.properties.gclid' }
        }
      }
    },
    dclid: {
      label: 'Display Click ID',
      description: 'The Display Click ID (dclid) associated with the conversion.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.integrations.Campaign Manager 360.dclid' },
          then: { '@path': '$.integrations.Campaign Manager 360.dclid' },
          else: { '@path': '$.properties.dclid' }
        }
      }
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
      required: false
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
      required: false
    },
    childDirectedTreatment: {
      label: 'Child Directed Treatment',
      description: 'Whether this particular request may come from a user under the age of 13, under COPPA compliance.',
      type: 'boolean',
      required: false
    },
    nonPersonalizedAd: {
      label: 'Non-Personalized Ad',
      description: 'Whether the conversion was for a non personalized ad.',
      type: 'boolean',
      required: false
    },
    treatmentForUnderage: {
      label: 'Treatment For Underage',
      description:
        "Whether this particular request may come from a user under the age of 16 (may differ by country), under compliance with the European Union's General Data Protection Regulation (GDPR).",
      type: 'boolean',
      required: false
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
    },
    userIdentifiers: {
      label: 'User Identifiers',
      description:
        'User identifiers associated with the conversion. The maximum number of user identifiers for each conversion is 5.',
      type: 'string',
      required: false,
      multiple: true
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
    }
  },
  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchupdate
  perform: async (request, { settings, payload }) => {
    const conversionsBatchUpdateRequest = validateUpdateConversionPayloads([payload], settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchupdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchUpdateRequest
      }
    )
    return response
  },
  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchupdate
  performBatch: async (request, { settings, payload }) => {
    const conversionsBatchUpdateRequest = validateUpdateConversionPayloads(payload, settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchupdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchUpdateRequest
      }
    )
    return response
  }
}

export default action
