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
    externalUserId: {
      label: 'External User ID',
      description: 'This is an external user identifier defined by data providers.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Traits or properties object from the payload',
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
    computation_key: {
      label: 'Computation Key',
      description: 'Audience name AKA Audience Key',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    email: {
      label: 'Email',
      description: 'User email address. Vaule will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    firstname: {
      label: 'First name',
      description: 'User first name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.first_name' },
          then: { '@path': '$.context.traits.first_name' },
          else: { '@path': '$.traits.first_name' }
        }
      }
    },
    lastname: {
      label: 'Last name',
      description: 'User Last name. Vaue will be hashed before sending to Amazon.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.last_name' },
          then: { '@path': '$.context.traits.last_name' },
          else: { '@path': '$.traits.last_name' }
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
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.traits.phone' }
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
          exists: { '@path': '$.context.traits.postal' },
          then: { '@path': '$.context.traits.postal' },
          else: { '@path': '$.traits.postal' }
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
          exists: { '@path': '$.context.traits.state' },
          then: { '@path': '$.context.traits.state' },
          else: { '@path': '$.traits.state' }
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
          exists: { '@path': '$.context.traits.city' },
          then: { '@path': '$.context.traits.city' },
          else: { '@path': '$.traits.city' }
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
          exists: { '@path': '$.context.traits.address' },
          then: { '@path': '$.context.traits.address' },
          else: { '@path': '$.traits.address' }
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
    }
  },
  perform: (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
  // performBatch: (request, { settings, payload: payloads, statsContext }) => {
  //   return processPayload(request, settings, payloads, statsContext)
  // }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  if (!payload.audienceId) {
    throw new PayloadValidationError('Audience ID is required.')
  }

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

    const response = await request(`${settings.region}/amc/audiences/records`, {
      method: 'POST',
      json: payload,
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

// async function normalizeAndHash(data: string) {
//   // Normalize the data
//   const normalizedData = data.toLowerCase().trim() // Example: Convert to lowercase and remove leading/trailing spaces
//   // Hash the normalized data using SHA-256
//   const sha256Hash = crypto.createHash('sha256').update(normalizedData).digest('hex')

//   return sha256Hash
// }

export default action
