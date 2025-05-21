import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validationError, sortPayload } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync users to Snap',
  defaultSubscription: 'type = "track"',
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
    props: {
      label: 'Properties object',
      description: 'A computed object for track events.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.properties' }
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
      description: 'Choose the type of identifier to use when adding users to Snap.',
      default: 'EMAIL_SHA256',
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
    },
    phone: {
      label: 'Phone',
      description:
        "If using phone as the identifier, an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'phone' is configured as an additional identifier in the Audience settings tab.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.phone' },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'PHONE_SHA256'
          }
        ]
      },
      category: 'hashedPII'
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      required: false,
      default: { '@path': '$.context.traits.email' },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'EMAIL_SHA256'
          }
        ]
      },
      category: 'hashedPII'
    },
    advertising_id: {
      label: 'Mobile Advertising ID',
      description:
        "If using Mobile Ad ID as the identifier, an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'ios.idfa' and 'android.idfa' are configured as an additional identifier in the Audience settings tab.",
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
          }
        ]
      },
      category: 'hashedPII'
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

  if (enteredAudience.length === 0 && exitedAudience.length === 0) {
    throw new PayloadValidationError(`No ${validationError(schema_type)} identifier present in payload(s)`)
  }

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
