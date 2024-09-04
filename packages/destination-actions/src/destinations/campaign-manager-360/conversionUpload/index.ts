import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { buildInsertConversionBatchPayload } from './functions'
import { refreshGoogleAccessToken } from '../common-functions'
import { commonFields } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Upload',
  description: 'Send a conversion to Campaign Manager 360.',
  fields: { 
    customVariables: {
      label: 'Custom Variables',
      description: 'Custom variables associated with the conversion.',
      type: 'object',
      multiple: true,
      required: false,
      additionalProperties: false,
      properties: {
        type: {
          label: 'Type',
          description: 'The type of the custom variable.',
          type: 'string',
          required: true
        },
        value: {
          label: 'Value',
          description: 'The value of the custom variable.',
          type: 'string',
          required: true
        },
        kind: {
          label: 'Kind',
          description: 'The kind of the custom variable.',
          type: 'string',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.customVariables',
          {
            type: {
              '@path': '$.type'
            },
            value: {
              '@path': '$.value'
            },
            kind: {
              '@path': '$.kind'
            }
          }
        ]
      }
    }, 
    encryptedUserIdCandidates: {
      label: 'Encrypted User ID Candidates',
      description:
        'A comma separated list of the alphanumeric encrypted user IDs. Any user ID with exposure prior to the conversion timestamp will be used in the inserted conversion. If no such user ID is found then the conversion will be rejected with INVALID_ARGUMENT error. When set, `encryptionInfo` should also be specified.',
      type: 'string',
      required: false
    },
    encryptionInfo: {
      label: 'Encryption Info',
      description: 'A Description of how user IDs are encrypted.',
      type: 'object',
      required: false,
      properties: {
        encryptionEntityType: {
          label: 'Encryption Entity Type',
          description:
            'The encryption entity type. This should match the encryption type configuration for ad serving or Data Transfer.',
          type: 'string',
          choices: [
            { label: 'ENCRYPTION_ENTITY_TYPE_UNKNOWN', value: 'ENCRYPTION_ENTITY_TYPE_UNKNOWN' },
            { label: 'DCM_ACCOUNT', value: 'DCM_ACCOUNT' },
            { label: 'DCM_ADVERTISER', value: 'DCM_ADVERTISER' },
            { label: 'DBM_PARTNER', value: 'DBM_PARTNER' },
            { label: 'DBM_ADVERTISER', value: 'DBM_ADVERTISER' },
            { label: 'ADWORDS_CUSTOMER', value: 'ADWORDS_CUSTOMER' },
            { label: 'DFP_NETWORK_CODE', value: 'DFP_NETWORK_CODE' }
          ],
          required: true
        },
        encryptionEntityId: {
          label: 'Encryption Entity ID',
          description:
            'The encryption entity ID. This should match the encryption configuration for ad serving or Data Transfer.',
          type: 'string',
          required: true
        },
        encryptionSource: {
          label: 'Encryption Source',
          description:
            'Describes whether the encrypted cookie was received from ad serving (the %m macro) or from Data Transfer.',
          type: 'string',
          choices: [
            { label: 'ENCRYPTION_SCOPE_UNKNOWN', value: 'ENCRYPTION_SCOPE_UNKNOWN' },
            { label: 'AD_SERVING', value: 'AD_SERVING' },
            { label: 'DATA_TRANSFER', value: 'DATA_TRANSFER' }
          ],
          required: true
        },
        kind: {
          label: 'Kind',
          description: 'Identifies what kind of resource this is. Value: the fixed string',
          type: 'string',
          required: true
        }
      }
    },
    ...commonFields
  },

  // So far, Google didn't provide an answer whether this is a good way to fetch the Floodlight Configurations.
  // The current implementation is commented out and the Floodlight Configuration ID is not dynamic.
  /* dynamicFields: {
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
  }, */

  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchinsert
  perform: async (request, { settings, payload }) => {
    const conversionsBatchInsertRequest = buildInsertConversionBatchPayload([payload], settings)
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
  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchinsert
  performBatch: async (request, { settings, payload }) => {
    const conversionsBatchInsertRequest = buildInsertConversionBatchPayload(payload, settings)
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
