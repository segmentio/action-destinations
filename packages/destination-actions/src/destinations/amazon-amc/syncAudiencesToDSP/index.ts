import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CONSTANTS, RecordsResponseType } from '../utils'
import { createHash } from 'crypto'
import { AudienceRecord, HashedPIIObject } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences to DSP',
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
      default: { '@path': '$.properties.email' }
    },
    firstName: {
      label: 'First name',
      description: 'User first name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.first_name' }
    },
    lastName: {
      label: 'Last name',
      description: 'User Last name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.last_name' }
    },
    phone: {
      label: 'Phone',
      description: 'Phone Number. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.phone' }
    },
    postal: {
      label: 'Postal',
      description: 'POstal Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.postal' }
    },
    state: {
      label: 'State',
      description: 'State Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.state' }
    },
    city: {
      label: 'City',
      description: 'City name. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.city' }
    },
    address: {
      label: 'Address',
      description: 'Address Code. Value will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.address' }
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

    const payloadRecord: AudienceRecord = {
      externalUserId: payload.externalUserId,
      countryCode: audienceSettings.countryCode,
      action: payload.event_name == 'Audience Entered' ? CONSTANTS.CREATE : CONSTANTS.DELETE,
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
