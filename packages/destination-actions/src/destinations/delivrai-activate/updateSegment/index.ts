import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload, generate_jwt } from '../utils-rt'
import { DELIVRAI_SEGMENTATION_AUDIENCE, DELIVRAI_BASE_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Delivr AI Audience Segmentation',
  description: 'Sync Segment Audience to Delivr AI Audience Segmentation',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Delivr AI Taxonomy Segment Id
      description: 'Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Delivr AI Audience Segment',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    email: {
      label: 'User Email',
      description: 'Email address of a user',
      type: 'string',
      unsafe_hidden: false,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' } // Phone is sent as identify's trait or track's context.trait
        }
      }
    },
    phone: {
      label: 'User Phone',
      description: 'Phone number of a user',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' }, // Phone is sent as identify's trait or track's property
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    advertising_id: {
      label: 'User Mobile Advertising ID',
      description: "User's mobile advertising Id",
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    segment_audience_key: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the "Name" of the Segment node in Delivr AI Audience Segmentation',
      type: 'string',
      // unsafe_hidden: true,
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
    const rt_access_token_response: any = settings?.client_identifier_id != '' ? await generate_jwt(settings?.client_identifier_id, request) : '';
    const rt_access_token = rt_access_token_response != 401 ? rt_access_token_response?.data?.token : 401;
    return rt_access_token != 401 ?  process_payload(request, [payload], rt_access_token, settings?.client_identifier_id) : [{status : false , message :"not valid customer"}];
  },
  performBatch: async (request, { payload, settings }) => {
    const rt_access_token_response: any = await generate_jwt(settings?.client_identifier_id, request);

    const rt_access_token = rt_access_token_response?.data?.token;

    return process_payload(request, payload, rt_access_token, settings?.client_identifier_id)
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
    })
  } else {
    throw new PayloadValidationError('Selected identifier(s) not available in the event(s)')
  }
}

export default action
