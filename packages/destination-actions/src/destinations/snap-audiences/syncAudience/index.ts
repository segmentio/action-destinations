import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validationError, sortPayload } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage Audiences to Snapchat',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    external_audience_id: {
      type: 'string',
      label: 'External Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    audienceKey: {
      type: 'string',
      label: 'Audience Key',
      description: 'Audience key.',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events.',
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
    schema_type: {
      type: 'string',
      choices: [
        { value: 'MOBILE_AD_ID_SHA256', label: 'Mobile ID' },
        { value: 'PHONE_SHA256', label: 'Phone' },
        { value: 'EMAIL_SHA256', label: 'Email' }
      ],
      label: 'External ID Type',
      required: true,
      description: 'Choose the type of identifier to use when adding users to Snapchat.',
      default: 'EMAIL_SHA256'
    },
    phone: {
      label: 'Phone',
      description:
        "The user's phone number. Note: Phone is not included in audience payloads by default. To sync phone numbers, be sure to add them as an additional identifier in the Audience settings page.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'PHONE_SHA256'
          }
        ]
      }
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'EMAIL_SHA256'
          }
        ]
      }
    },
    advertising_id: {
      label: 'Mobile Advertising ID',
      description:
        "The user's mobile advertising ID. Note: Mobile Advertising Id is not included in audience payloads by default. To sync them, ensure the relevant mobile ID is added as an additional identifier in the Audience settings page.",
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.device.advertisingId'
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'MOBILE_AD_ID_SHA256'
          },
          {
            fieldKey: 'mobile_id_type',
            operator: 'is',
            value: 'advertisingId'
          }
        ]
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled, events will be batched before being sent to Snap.',
      type: 'boolean',
      required: true,
      default: true
    }
  },
  perform: async (request, { payload }) => {
    return processPayload(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return processPayload(request, payload)
  }
}

export default action

const processPayload = async (request: RequestClient, payload: Payload[]) => {
  const { external_audience_id, schema_type } = payload[0]
  const { enteredAudience, exitedAudience } = sortPayload(payload)

  if (enteredAudience.length === 0 && exitedAudience.length === 0)
    throw new PayloadValidationError(`No ${validationError(schema_type)} identifier present in payload(s)`)

  const requests = []

  if (enteredAudience.length > 0) {
    requests.push(
      request(`https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`, {
        method: 'post',
        json: {
          users: [
            {
              schema: [`${schema_type}`],
              data: enteredAudience
            }
          ]
        }
      })
    )
  }

  if (exitedAudience.length > 0) {
    requests.push(
      request(`https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`, {
        method: 'delete',
        json: {
          users: [
            {
              schema: [`${schema_type}`],
              data: exitedAudience
            }
          ]
        }
      })
    )
  }

  return await Promise.all(requests)
}
