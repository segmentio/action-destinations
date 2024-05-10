import type { ActionDefinition, RequestClient, StatsContext } from '@segment/actions-core'
import { IntegrationError, APIError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AmazonAdsError } from '../utils'
import { createHash } from 'crypto'
import { AudienceRecord, HashedPIIObject } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync audiences from Segment to Amazon Ads Audience.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    externalUserId: {
      label: 'External User ID',
      description: 'This is an external user identifier defined by data providers.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    email: {
      label: 'Email',
      description: 'User email address. Vaule will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.email' },
          then: { '@path': '$.context.properties.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    firstName: {
      label: 'First name',
      description: 'User first name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.first_name' },
          then: { '@path': '$.context.properties.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    lastName: {
      label: 'Last name',
      description: 'User Last name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.last_name' },
          then: { '@path': '$.context.properties.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: 'Phone Number. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.phone' },
          then: { '@path': '$.context.properties.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    postal: {
      label: 'Postal',
      description: 'POstal Code. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.postal' },
          then: { '@path': '$.context.properties.postal' },
          else: { '@path': '$.properties.postal' }
        }
      }
    },
    state: {
      label: 'Postal',
      description: 'State Code. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.state' },
          then: { '@path': '$.context.properties.state' },
          else: { '@path': '$.properties.state' }
        }
      }
    },
    city: {
      label: 'City',
      description: 'City name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.city' },
          then: { '@path': '$.context.properties.city' },
          else: { '@path': '$.properties.city' }
        }
      }
    },
    address: {
      label: 'Address',
      description: 'Address Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.properties.address' },
          then: { '@path': '$.context.properties.address' },
          else: { '@path': '$.properties.address' }
        }
      }
    },
    audienceId: {
      label: 'Audience ID',
      type: 'string',
      required: true,
      description:
        'An number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.',
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled,segment will send data in batching',
      type: 'boolean',
      required: true,
      default: true
    }
    // batch_size: {
    //   label: 'Batch Size',
    //   description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    //   type: 'number',
    //   unsafe_hidden: true,
    //   required: false,
    //   default: 10000
    // }
  },
  perform: (request, { settings, payload, statsContext, audienceSettings }) => {
    return processPayload(request, settings, [payload], statsContext, audienceSettings)
  },
  performBatch: (request, { settings, payload: payloads, statsContext, audienceSettings }) => {
    return processPayload(request, settings, payloads, statsContext, audienceSettings)
  }
}

async function processPayload(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  statsContext: StatsContext | undefined,
  audienceSettings: AudienceSettings
) {
  const { statsClient, tags: statsTags } = statsContext || {}
  const statsName = 'syncAmazonAdsAudiences'
  statsClient?.incr(`${statsName}.intialise`, 1, statsTags)

  try {
    const payloadRecord = createPayloadToUploadRecords(payload, audienceSettings)
    // Replace the string with an unquoted number
    const payloadString = JSON.stringify(payloadRecord).replace(/"audienceId":"(\d+)"/, '"audienceId":$1')

    const response = await request(`${settings.region}/amc/audiences/records`, {
      method: 'POST',
      body: payloadString,
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
    //test commit
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

function createPayloadToUploadRecords(payloads: Payload[], audienceSettings: AudienceSettings) {
  const records: AudienceRecord[] = []
  const { audienceId } = payloads[0]
  payloads.forEach((payload: Payload) => {
    const hashedPII: HashedPIIObject = {}
    if (payload.firstName) {
      hashedPII.firstname = normalizeAndHash(payload.firstName)
    }
    if (payload.lastName) {
      hashedPII.lastname = normalizeAndHash(payload.lastName)
    }
    if (payload.address) {
      hashedPII.address = normalizeAndHash(payload.address)
    }
    if (payload.postal) {
      hashedPII.postal = normalizeAndHash(payload.postal)
    }
    if (payload.phone) {
      hashedPII.phone = normalizeAndHash(payload.phone)
    }
    if (payload.city) {
      hashedPII.city = normalizeAndHash(payload.city)
    }
    if (payload.state) {
      hashedPII.state = normalizeAndHash(payload.state)
    }
    if (payload.email) {
      hashedPII.email = normalizeAndHash(payload.email)
    }

    const payloadRecord: AudienceRecord = {
      externalUserId: payload.externalUserId,
      countryCode: audienceSettings.countryCode,
      action: payload.event_name == 'Audience Entered' ? 'CREATE' : 'DELETE',
      hashedPII: [hashedPII]
    }
    records.push(payloadRecord)
  })

  return {
    records: records,
    audienceId: audienceId
  }
}

function normalizeAndHash(data: string) {
  // Normalize the data
  const normalizedData = data.toLowerCase().trim() // Example: Convert to lowercase and remove leading/trailing spaces
  // Hash the normalized data using SHA-256
  const hash = createHash('sha256')
  hash.update(normalizedData)
  return hash.digest('hex')
}

export default action
