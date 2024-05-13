import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { IntegrationError, APIError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AmazonAdsError, CONSTANTS } from '../utils'
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
    // traits_or_props: {
    //   label: 'Traits or Properties',
    //   description: 'Traits or properties object from the payload',
    //   type: 'object',
    //   required: true,
    //   unsafe_hidden: true,
    //   default: {
    //     '@if': {
    //       exists: { '@path': '$.properties' },
    //       then: { '@path': '$.properties' },
    //       else: { '@path': '$.traits' }
    //     }
    //   }
    // },
    // computation_key: {
    //   label: 'Computation Key',
    //   description: 'Audience name AKA Audience Key',
    //   type: 'string',
    //   required: true,
    //   unsafe_hidden: true,
    //   default: { '@path': '$.context.personas.computation_key' }
    // },
    email: {
      label: 'Email',
      description: 'User email address. Vaule will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.email' }
    },
    firstName: {
      label: 'First name',
      description: 'User first name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.first_name' }
    },
    lastName: {
      label: 'Last name',
      description: 'User Last name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.last_name' }
    },
    phone: {
      label: 'Phone',
      description: 'Phone Number. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.phone' }
    },
    postal: {
      label: 'Postal',
      description: 'POstal Code. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.postal' }
    },
    state: {
      label: 'Postal',
      description: 'State Code. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.state' }
    },
    city: {
      label: 'City',
      description: 'City name. Vaue will be hashed before sending to Amazon.',
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
  try {
    // for (const record of payload.records) {
    //   for (const pii of record.hashedPII) {
    //     for (const key in pii) {
    //       if (pii[key as keyof typeof pii] !== undefined) {
    //         pii[key as keyof typeof pii] = await normalizeAndHash(pii[key as keyof typeof pii]!)
    //       }
    //     }
    //   }
    // }
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

    if (!jobRequestId) {
      throw new IntegrationError('Invalid response from upload audinece record call', 'INVALID_RESPONSE', 400)
    }
    return {
      result
    }
  } catch (e) {
    if (e instanceof AmazonAdsError) {
      const message = JSON.parse(e.response?.data?.message || '')
      throw new APIError(message, e.response?.status)
    } else if (e instanceof IntegrationError) {
      throw new APIError(e.message, 400)
    } else {
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
