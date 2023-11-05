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
    email: {
      label: 'User Email',
      description: 'Email address of a user',
      type: 'string',
      unsafe_hidden: true,
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
      unsafe_hidden: true,
      default: {
        '@path': '$.context.device.advertisingId'
      },
      required: false
    },
    phone: {
      label: 'User Phone',
      description: 'Phone number of a user',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' }, // Phone is sent as identify's trait or track's property
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    device_type: {
      label: 'User Mobile Device Type', // This field is required to determine the type of the advertising Id: IDFA or GAID
      description: "User's mobile device type",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.device.type'
      },
      required: false
    },
    // identifier: {
    //   label: 'User Identifier',
    //   description: 'Specify the identifier(s) to send to Yahoo',
    //   type: 'string',
    //   required: true,
    //   default: 'email',
    //   choices: [
    //     { value: 'email', label: 'Send email' },
    //     { value: 'maid', label: 'Send MAID' },
    //     { value: 'phone', label: 'Send phone' },
    //     { value: 'email_maid', label: 'Send email and/or MAID' },
    //     { value: 'email_maid_phone', label: 'Send email, MAID and/or phone' },
    //     { value: 'email_phone', label: 'Send email and/or phone' },
    //     { value: 'phone_maid', label: 'Send phone and/or MAID' }
    //   ]
    // },
    gdpr_flag: {
      label: 'GDPR Flag',
      description: 'Set to true to indicate that audience data is subject to GDPR regulations',
      type: 'boolean',
      required: true,
      default: false
    },
    gdpr_euconsent: {
      label: 'GDPR Consent Attributes',
      description:
        'Required if GDPR flag is set to "true". Using IAB Purpose bit descriptions specify the following user consent attributes: "Storage and Access of Information", "Personalization"',
      type: 'string',
      required: false
    }
  },

  perform: (request, { payload, auth, statsContext }) => {
    const rt_access_token = auth?.accessToken
    //const rt_access_token = 'cc606d91-1786-47a0-87fd-6f48ee70fa7c'
    return process_payload(request, [payload], rt_access_token, statsContext)
  },
  performBatch: (request, { payload, auth, statsContext }) => {
    const rt_access_token = auth?.accessToken
    //const rt_access_token = 'cc606d91-1786-47a0-87fd-6f48ee70fa7c'
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
      statsClient?.incr('yahoo_audiences', 1, [...statsTag, 'action:updateSegmentTriggered'])
      statsClient?.incr('yahoo_audiences', body.data.length, [...statsTag, 'action:updateSegmentRecordsSent'])
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
      statsClient?.incr('yahoo_audiences', 1, [...statsTag, 'action:updateSegmentDiscarded'])
    }
    throw new PayloadValidationError('Selected identifier(s) not available in the event(s)')
  }
}

export default action
