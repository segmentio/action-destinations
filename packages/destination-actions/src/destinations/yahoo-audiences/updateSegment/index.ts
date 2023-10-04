import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_update_segment_payload } from '../utils-rt'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'type = "identify"',
  fields: {
    segment_audience_id: {
      label: 'Segment Audience Id', // Maps to Yahoo Taxonomy Segment Id
      description: 'Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Yahoo taxonomy',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy',
      type: 'hidden',
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
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests',
      type: 'boolean', // We should always batch Yahoo requests
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      default: 1000
    },
    email: {
      label: 'User Email',
      description: 'Email address of a user',
      type: 'hidden',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    advertising_id: {
      label: 'User Mobile Advertising ID',
      description: "User's mobile advertising Id",
      type: 'hidden',
      default: {
        '@path': '$.context.device.advertisingId'
      },
      required: false
    },
    device_type: {
      label: 'User Mobile Device Type', // This field is required to determine the type of the advertising Id: IDFA or GAID
      description: "User's mobile device type",
      type: 'hidden',
      default: {
        '@path': '$.context.device.type'
      },
      required: false
    },
    identifier: {
      label: 'User Identifier',
      description: 'Specify the identifier(s) to send to Yahoo',
      type: 'string',
      required: true,
      default: 'email',
      choices: [
        { value: 'email', label: 'Send email' },
        { value: 'maid', label: 'Send MAID' },
        { value: 'email_maid', label: 'Send email and/or MAID' }
      ]
    },
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

  perform: (request, { payload, auth, audienceSettings }) => {
    const rt_access_token = auth?.accessToken
    if (!rt_access_token) {
      throw new IntegrationError('Missing authentication token', 'MISSING_REQUIRED_FIELD', 400)
    }
    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }
    const body = gen_update_segment_payload([payload], audienceSettings)
    // Send request to Yahoo only when the event includes selected Ids
    if (body.data.length > 0) {
      return request('https://dataxonline.yahoo.com/online/audience/', {
        method: 'POST',
        json: body,
        headers: {
          Authorization: `Bearer ${rt_access_token}`
        }
      })
    }

    throw new PayloadValidationError('Email and / or Advertising Id not available in the profile(s)')
  },
  performBatch: (request, { payload, audienceSettings, auth }) => {
    const rt_access_token = auth?.accessToken
    if (!rt_access_token) {
      throw new IntegrationError('Missing authentication token', 'MISSING_REQUIRED_FIELD', 400)
    }
    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }
    const body = gen_update_segment_payload(payload, audienceSettings)
    // Send request to Yahoo only when all events in the batch include selected Ids
    if (body.data.length > 0) {
      return request('https://dataxonline.yahoo.com/online/audience/', {
        method: 'POST',
        json: body,
        headers: {
          Authorization: `Bearer ${rt_access_token}`
        }
      })
    }

    throw new PayloadValidationError('Email and / or Advertising Id not available in the profile(s)')
  }
}

export default action
