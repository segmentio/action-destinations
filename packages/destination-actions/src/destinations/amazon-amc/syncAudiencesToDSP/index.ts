import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CONSTANTS, RecordsResponseType } from '../utils'
import { createHash } from 'crypto'
import { AudienceRecord, HashedPIIObject } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences to DSP',
  description: 'Sync audiences from Segment to Amazon Ads Audience.',
  defaultSubscription: 'type="identify" or type="track"',
  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_class: {
      label: 'Segment Computation Class',
      description:
        "Segment computation Class",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
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
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    firstName: {
      label: 'First name',
      description: 'User first name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    lastName: {
      label: 'Last name',
      description: 'User Last name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: 'Phone Number. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    postal: {
      label: 'Postal',
      description: 'POstal Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.postal_code' },
          then: { '@path': '$.traits.postal_code' },
          else: { '@path': '$.context.traits.postal_code' }
        }
      }
    },
    state: {
      label: 'Stage',
      description: 'State Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.state' },
          then: { '@path': '$.traits.state' },
          else: { '@path': '$.properties.state' }
        }
      }
    },
    city: {
      label: 'City',
      description: 'City name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.city' },
          then: { '@path': '$.traits.city' },
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
          exists: { '@path': '$.traits.address' },
          then: { '@path': '$.traits.address' },
          else: { '@path': '$.properties.address' }
        }
      }
    },
    audienceId: {
      label: 'Audience ID',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      description:
        'A number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.',
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
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 10000
    }
  },
  perform: (request, { settings, payload, audienceSettings }) => {
    return processPayload(request, settings, [payload], audienceSettings)
  },
  performBatch: (request, { settings, payload: payloads, audienceSettings }) => {
    return processPayload(request, settings, payloads, audienceSettings)
  }
}

async function processPayload(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  audienceSettings: AudienceSettings
) {
  const payloadRecord = createPayloadToUploadRecords(payload, audienceSettings)
  // Regular expression to find a audienceId numeric string and replace the quoted audienceId string with an unquoted number
  const payloadString = JSON.stringify(payloadRecord).replace(/"audienceId":"(\d+)"/, '"audienceId":$1')

  const response = await request<RecordsResponseType>(`${settings.region}/amc/audiences/records`, {
    method: 'POST',
    body: payloadString,
    headers: {
      'Content-Type': 'application/vnd.amcaudiences.v1+json'
    }
  })

  const result = response.data
  return {
    result
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

    const action = payload.traits_or_props[payload.segment_audience_key] ? CONSTANTS.ADD : CONSTANTS.REMOVE

    const payloadRecord: AudienceRecord = {
      externalUserId: payload.externalUserId,
      countryCode: audienceSettings.countryCode,
      action: action ? CONSTANTS.CREATE : CONSTANTS.DELETE,
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
