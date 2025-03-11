import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CustomAttribute, User } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Attributes',
  description: 'Send custom attributes to Attentive.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userIdentifiers: {
      label: 'User Identifiers',
      description:
        'At least one identifier is required. Custom identifiers can be added as additional key:value pairs.',
      type: 'object',
      required: true,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue:only',
      properties: {
        phone: {
          label: 'Phone',
          description: "The user's phone number in E.164 format.",
          type: 'string',
          required: false
        },
        email: {
          label: 'Email',
          description: "The user's email address.",
          type: 'string',
          format: 'email',
          required: false
        },
        clientUserId: {
          label: 'Client User ID',
          description: 'A primary ID for a user. Should be a UUID.',
          type: 'string',
          format: 'uuid',
          required: false
        }
      },
      default: {
        phone: {
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        clientUserId: { '@path': '$.userId' }
      }
    },
    properties: {
      label: 'Properties',
      description: 'Custom attributes to associate with the user.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    },
    externalEventId: {
      label: 'External Event Id',
      description: 'A unique identifier representing this specific event. Should be a UUID format.',
      type: 'string',
      format: 'uuid',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    occurredAt: {
      label: 'Occurred At',
      description: 'Timestamp for the event, ISO 8601 format.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload }) => {
    const {
      externalEventId,
      properties,
      occurredAt,
      userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
    } = payload

    // Ensure at least one identifier exists
    if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
      throw new PayloadValidationError('At least one user identifier is required.')
    }

    // Construct the custom attributes payload
    const json: CustomAttribute = {
      properties,
      externalEventId,
      occurredAt,
      user: {
        phone,
        email,
        ...(clientUserId || customIdentifiers
          ? {
              externalIdentifiers: {
                ...(clientUserId ? { clientUserId } : undefined),
                ...(Object.entries(customIdentifiers).length > 0 ? { customIdentifiers } : undefined)
              }
            }
          : {})
      } as User
    }

    // Send the request to the Attentive API
    return request('https://api.attentivemobile.com/v1/attributes/custom', {
      method: 'post',
      json
    })
  }
}

export default action
