import type { ActionDefinition, RequestClient, StatsContext } from '@segment/actions-core'
import { PayloadValidationError, IntegrationError, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AmazonAdsError } from '../utils'
import * as crypto from 'crypto'

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
        externalUserId: {
          label: 'External User ID',
          description: 'This is an external user identifier defined by data providers.',
          type: 'string',
          required: true
        },
        action: {
          label: 'User Action',
          description: 'A specific key used to define action type.',
          type: 'string',
          required: true,
          choices: [
            { label: `Create`, value: 'CREATE' },
            { label: 'Delete', value: 'DELETE' }
          ],
          default: 'CREATE'
        },
        countryCode: {
          label: 'Country Code',
          description: 'A String value representing ISO 3166-1 alpha-2 country code for the members in this audience.',
          type: 'string'
        },
        measurements: {
          label: 'Measurements',
          type: 'object'
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
  perform: (request, { settings, payload, statsContext }) => {
    return processPayload(request, settings, payload, statsContext)
  }
}

async function processPayload(
  request: RequestClient,
  settings: Settings,
  payload: Payload,
  statsContext: StatsContext | undefined
) {
  const { statsClient, tags: statsTags } = statsContext || {}
  const statsName = 'syncAmazonAudience'
  statsTags?.push(`payload:${payload}`)
  statsClient?.incr(`${statsName}.intialise`, 1, statsTags)

  if (!payload.audienceId) {
    throw new PayloadValidationError('Audience ID is required.')
  }

  try {
    for (const record of payload.records) {
      for (const pii of record.hashedPII) {
        for (const key in pii) {
          if (pii[key as keyof typeof pii] !== undefined) {
            pii[key as keyof typeof pii] = await normalizeAndHash(pii[key as keyof typeof pii]!)
          }
        }
      }
    }

    const response = await request(`${settings.region}/amc/audiences/records`, {
      method: 'POST',
      json: payload,
      headers: {
        'Content-Type': 'application/vnd.amcaudiences.v1+json'
      }
    })

    const result = await response.json()
    const jobRequestId = result?.jobRequestId

    statsTags?.push(`jobRequestId:${jobRequestId}`)
    statsClient?.incr(`${statsName}.success`, 1, statsTags)

    if (!jobRequestId) {
      throw new IntegrationError('Invalid response from upload audinece record call', 'INVALID_RESPONSE', 400)
    }

    return {
      result
    }
  } catch (e) {
    if (e instanceof AmazonAdsError) {
      const message = JSON.parse(e.response?.data?.message || '')
      statsTags?.push(`error:${message}`)
      statsClient?.incr(`${statsName}.error`, 1, statsTags)
      throw new APIError(message, e.response?.status)
    } else if (e instanceof IntegrationError) {
      statsTags?.push(`error:${e.message}`)
      statsClient?.incr(`${statsName}.error`, 1, statsTags)
      throw new APIError(e.message, 400)
    } else {
      statsTags?.push(`error:${e}`)
      statsClient?.incr(`${statsName}.error`, 1, statsTags)
      throw e
    }
  }
}

async function normalizeAndHash(data: string) {
  // Normalize the data
  const normalizedData = data.toLowerCase().trim() // Example: Convert to lowercase and remove leading/trailing spaces
  // Hash the normalized data using SHA-256
  const sha256Hash = crypto.createHash('sha256').update(normalizedData).digest('hex')

  return sha256Hash
}

export default action
