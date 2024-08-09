import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { refreshGoogleAccessToken, validateConversionPayloads } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Upload',
  description: "Inserts a conversion into Campaign Manager 360's profile configured under Settings.",
  fields: {
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
    ordinal: {
      label: 'Ordinal',
      description: 'The ordinal value of the conversion.',
      type: 'number',
      required: false
    },
    quantity: {
      label: 'Quantity',
      description: 'The quantity of the conversion.',
      type: 'number',
      required: false
    },
    timestampMicros: {
      label: 'Timestamp (Microseconds)',
      description: 'The timestamp of the conversion in microseconds.',
      type: 'number',
      required: false
    },
    value: {
      label: 'Value',
      description: 'The value of the conversion.',
      type: 'number',
      required: false
    },
    customVariables: {
      label: 'Custom Variables',
      description: 'Custom variables associated with the conversion.',
      type: 'object',
      required: false
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
    const conversionsBatchInsertRequest = validateConversionPayloads([payload], settings)
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
    const conversionsBatchInsertRequest = validateConversionPayloads(payload, settings)
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
