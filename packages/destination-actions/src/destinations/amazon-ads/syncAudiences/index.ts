import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError, IntegrationError, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AmazonAdsError } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync audiences from Segment to Amazon Ads Audience.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    records: {
      label: 'Records',
      description: 'Records to create and upload audiences to Amazon DSP.',
      type: 'object',
      multiple: true,
      required: true,
      properties: {
        external_user_id: {
          label: 'External User ID',
          description: 'This is an external user identifier defined by data providers.',
          type: 'string',
          required: true
        },
        user_action: {
          label: 'User Action',
          description: 'A specific key used to define action type.',
          type: 'string',
          required: true,
          choices: [
            { label: `Auto Detect`, value: 'AUTO' },
            { label: `Create`, value: 'CREATE' },
            { label: 'Delete', value: 'DELETE' }
          ],
          default: 'AUTO'
        },
        country_code: {
          label: 'Country Code',
          description: 'A String value representing ISO 3166-1 alpha-2 country code for the members in this audience.',
          type: 'string'
        },
        measurements: {
          label: 'Measurements',
          type: 'string'
        },
        hashedPII: {
          label: `hashed PII`,
          description:
            'List of hashed personally-identifiable information records to be matched with Amazon identities for future use. All inputs must be properly normalized and SHA-256 hashed.',
          type: 'object',
          required: true,
          multiple: true,
          properties: {
            firstname: {
              label: 'Measurements',
              type: 'string'
            },
            address: {
              label: 'Measurements',
              type: 'string'
            },
            phone: {
              label: 'Measurements',
              type: 'string'
            },
            city: {
              label: 'Measurements',
              type: 'string'
            },
            state: {
              label: 'Measurements',
              type: 'string'
            },
            email: {
              label: 'Measurements',
              type: 'string'
            },
            lastname: {
              label: 'Measurements',
              type: 'string'
            },
            postal: {
              label: 'Measurements',
              type: 'string'
            }
          }
        }
      }
    },
    audienceId: {
      label: 'Audience ID',
      type: 'number',
      required: true,
      description:
        'An number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.'
    }
  },
  perform: (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  if (payload.audienceId) {
    throw new PayloadValidationError('Audience ID is required.')
  }

  try {
    const response = await request(`${settings.region}/amc/audiences/records`, {
      method: 'POST',
      json: payload
    })

    const r = await response.json()

    const jobRequestId = r.data.jobRequestId

    if (!jobRequestId) {
      throw new IntegrationError('Invalid response from upload audinece record call', 'INVALID_RESPONSE', 400)
    }

    return {
      jobRequestId
    }
  } catch (e) {
    const error = e as AmazonAdsError
    const { message } = JSON.parse(error.response.data)
    throw new APIError(message, error.response.status)
  }
}

export default action
