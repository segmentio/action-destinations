import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError, InvalidAuthenticationError, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload, generate_jwt } from '../utils-rt'
import { DELIVRAI_SEGMENTATION_AUDIENCE, DELIVRAI_BASE_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Delivr AI Audience Segmentation',
  description: 'Sync Segment Audience to Delivr AI Audience Segmentation.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Delivr AI Taxonomy Segment Id
      description: 'Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Delivr AI Audience Segment.',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    email: {
      label: 'User Email',
      description: 'Email address of a user.',
      type: 'string',
      unsafe_hidden: false,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' } // Phone is sent as identify's trait or track's context.trait
        }
      },
      category: 'hashedPII'
    },
    phone: {
      label: 'User Phone',
      description: 'Phone number of a user.',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' }, // Phone is sent as identify's trait or track's property
          else: { '@path': '$.properties.phone' }
        }
      },
      category: 'hashedPII'
    },
    device_type: {
      label: 'User Mobile Device Type', // This field is required to determine the type of the advertising Id: IDFA or GAID
      description: "User's mobile device type",
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.context.device.type'
      }
    },
    advertising_id: {
      label: 'User Mobile Advertising ID',
      description: "User's mobile advertising Id.",
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    segment_audience_key: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the "Name" of the Segment node in Delivr AI Audience Segmentation.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    enable_batching: {
      label: 'Batch Data to Delivr AI',
      description:
        'If true, batch requests to Delivr AI. Delivr AI accepts batches of up to 1000 events. If false, send each event individually.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 1000,
      unsafe_hidden: true
    }
  },

  perform: async (request, { payload, settings }) => {
    // Check if client_identifier_id is valid
    let rt_access_token_response
    // Generate JWT token
    try {
      rt_access_token_response = await generate_jwt(settings.client_identifier_id, request)
    } catch (error) {
      if (error === 401) {
        throw new InvalidAuthenticationError('Invalid Client Identifier ID')
      } else {
        throw new APIError('Error Generating JWT', 400)
      }
    }
    const rt_access_token = rt_access_token_response?.data?.token
    // Process the payload with the valid token
    return process_payload(request, [payload], rt_access_token, settings.client_identifier_id)
  },
  performBatch: async (request, { payload, settings }) => {
    // Ensure client_identifier_id is provided
    let rt_access_token_response
    // Generate JWT token
    try {
      rt_access_token_response = await generate_jwt(settings.client_identifier_id, request)
    } catch (error) {
      if (error === 401) {
        throw new InvalidAuthenticationError('Invalid Client Identifier ID')
      } else {
        throw new APIError('Error Generating JWT', 400)
      }
    }
    const rt_access_token = rt_access_token_response?.data?.token
    // Process the payload with the valid token
    return process_payload(request, payload, rt_access_token, settings.client_identifier_id)
  }
}

// Makes a request to Delivr AI Realtime API to populate an audience
async function process_payload(
  request: RequestClient,
  payload: Payload[],
  token: string | undefined,
  client_identifier_id: string
) {
  const body = gen_update_segment_payload(payload, client_identifier_id)
  // Send request to Delivr AI only when all events in the batch include selected Ids
  if (body.data.length > 0) {
    return await request(`${DELIVRAI_BASE_URL}${DELIVRAI_SEGMENTATION_AUDIENCE}`, {
      method: 'POST',
      json: body,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch((err) => {
      throw new APIError(
        'HTTP error: ' + err?.response?.statusText || 'Something went wrong',
        err?.response?.status || 500
      )
    })
  } else {
    throw new PayloadValidationError('Selected identifier(s) not available in the event(s)')
  }
}

export default action
