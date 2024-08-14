import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { refreshGoogleAccessToken, validateInsertConversionPayloads } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Upload',
  description: "Inserts a conversion into Campaign Manager 360's profile configured under Settings.",
  fields: {
    floodlightConfigurationId: {
      label: 'Floodlight Configuration ID',
      description: 'The Floodlight configuration ID associated with the conversion.',
      type: 'string',
      required: false,
      dynamic: true
    },
    floodlightActivityId: {
      label: 'Floodlight Activity ID',
      description: 'The Floodlight activity ID associated with the conversion.',
      type: 'string',
      required: false
    },
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
    },
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
      required: false
    },
    timestampMicros: {
      label: 'Timestamp (Microseconds)',
      description: 'The timestamp of the conversion in microseconds.',
      type: 'number',
      required: true
    },
    value: {
      label: 'Value',
      description: 'The value of the conversion.',
      type: 'number',
      required: true
    },
    quantity: {
      label: 'Quantity',
      description: 'The quantity of the conversion.',
      type: 'number',
      required: true
    },
    ordinal: {
      label: 'Ordinal',
      description: 'The ordinal value of the conversion.',
      type: 'number',
      required: false
    },
    customVariables: {
      label: 'Custom Variables',
      description: 'Custom variables associated with the conversion.',
      type: 'object',
      required: false
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
    encryptedUserIdCandidates: {
      label: 'Encrypted User ID Candidates',
      description:
        'A list of the alphanumeric encrypted user IDs. Any user ID with exposure prior to the conversion timestamp will be used in the inserted conversion. If no such user ID is found then the conversion will be rejected with INVALID_ARGUMENT error. When set, `encryptionInfo` should also be specified.',
      type: 'string',
      required: false,
      multiple: true
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

  dynamicFields: {
    floodlightConfigurationId: async (request, { settings }) => {
      try {
        const bearerToken = await refreshGoogleAccessToken(request, settings)
        const response = await request(
          `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/floodlightConfigurations`,
          {
            headers: {
              Authorization: `Bearer ${bearerToken}`
            }
          }
        )

        console.log(response)
        return {
          choices: [
            {
              value: '12345',
              label: 'Floodlight Configuration 12345'
            }
          ]
        }
      } catch (error) {
        console.error(error)
        return {
          choices: [],
          nextPage: '',
          error: {
            message:
              'Error fetching Floodlight Configurations. Please provide the Floodlight Configuration ID manually.',
            code: '500'
          }
        }
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const conversionsBatchInsertRequest = validateInsertConversionPayloads([payload], settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchinsert`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchInsertRequest
      }
    )
    return response
  },
  performBatch: async (request, { settings, payload }) => {
    const conversionsBatchInsertRequest = validateInsertConversionPayloads(payload, settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchinsert`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchInsertRequest
      }
    )
    return response
  }
}

export default action
