import type { ActionDefinition, RequestClient, StatsContext } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload } from '../utils-rt'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Yahoo Taxonomy Segment Id
      description: 'Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Yahoo taxonomy',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    // Fetch event traits or props, which will be used to determine user's membership in an audience
    event_attributes: {
      label: 'Event traits or properties. Do not modify this setting',
      description: 'Event traits or properties. Do not modify this setting',
      type: 'object',
      readOnly: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
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
    email: {
      label: 'User Email',
      description: 'Email address of a user',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' } // Phone is sent as identify's trait or track's context.trait
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
    gdpr_settings: {
      label: 'GDPR Settings',
      description: 'GDPR Settings for the audience',
      type: 'object',
      allowNull: false,
      multiple: false,
      properties: {
        gdpr_flag: {
          label: 'GDPR Flag',
          type: 'boolean',
          required: true,
          default: false,
          description: 'Set to true to indicate that audience data is subject to GDPR regulations'
        },
        gdpr_euconsent: {
          label: 'GDPR Consent Attributes',
          type: 'string',
          required: false,
          description:
            'Required if GDPR flag is set to "true". Using IAB Purpose bit descriptions specify the following user consent attributes: "Storage and Access of Information", "Personalization"'
        }
      }
    },
    enable_batching: {
      label: 'Batch Data to Yahoo',
      description:
        'If true, batch requests to Yahoo. Yahoo accepts batches of up to 1000 events. If false, send each event individually.',
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

  perform: (request, { payload, auth, statsContext }) => {
    const rt_access_token = auth?.accessToken
    return process_payload(request, [payload], rt_access_token, statsContext)
  },
  performBatch: (request, { payload, auth, statsContext }) => {
    const rt_access_token = auth?.accessToken
    return process_payload(request, payload, rt_access_token, statsContext)
  }
}

// Makes a request to Yahoo Realtime API to populate an audience
async function process_payload(
  request: RequestClient,
  payload: Payload[],
  token: string | undefined,
  statsContext: StatsContext | undefined
) {
  const body = gen_update_segment_payload(payload)
  const statsClient = statsContext?.statsClient
  const statsTag = statsContext?.tags
  // Send request to Yahoo only when all events in the batch include selected Ids
  if (body.data.length > 0) {
    if (statsClient && statsTag) {
      statsClient?.incr('updateSegmentTriggered', 1, statsTag)
      for (let i = 0; i < body.data.length; i++) {
        statsClient?.incr('updateSegmentRecordsSent', 1, statsTag)
      }
    }
    return request('https://dataxonline.yahoo.com/online/audience/', {
      method: 'POST',
      json: body,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } else {
    if (statsClient && statsTag) {
      statsClient?.incr('updateSegmentDiscarded', 1, statsTag)
    }
    throw new PayloadValidationError('Selected identifier(s) not available in the event(s)')
  }
}

export default action
