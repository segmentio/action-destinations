import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertAttributeTimestamps, convertValidTimestamp, trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Person',
  description: 'Create a person in Customer.io or update them if they exist.',
  defaultSubscription: 'type = "identify"',
  fields: {
    id: {
      label: 'Person ID',
      description:
        'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      label: 'Email Address',
      description: "The person's email address.",
      type: 'string',
      default: {
        '@template': '{{traits.email}}'
      }
    },
    created_at: {
      label: 'Created At',
      description: 'A timestamp of when the person was created.',
      type: 'string',
      default: {
        '@template': '{{traits.created_at}}'
      }
    },
    group_id: {
      label: 'Object ID',
      description:
        'The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).',
      type: 'string',
      default: {
        '@path': '$.context.groupId'
      }
    },
    custom_attributes: {
      label: 'Person Attributes',
      description:
        'Optional attributes for the person. When updating a person, attributes are added or updated, not removed.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    },
    object_type_id: {
      label: 'Object Type Id',
      description:
        'The ID used to uniquely identify a custom object type in Customer.io. [Learn more](https://customer.io/docs/object-relationships).',
      type: 'string',
      default: {
        '@path': '$.objectTypeId'
      }
    }
  },

  perform: (request, { settings, payload }) => {
    let createdAt: string | number | undefined = payload.created_at
    let customAttributes = payload.custom_attributes
    const objectId = payload.group_id
    const objectTypeId = payload.object_type_id

    if (payload.convert_timestamp !== false) {
      if (createdAt) {
        createdAt = convertValidTimestamp(createdAt)
      }

      if (customAttributes) {
        customAttributes = convertAttributeTimestamps(customAttributes)
      }
    }

    const body: Record<string, unknown> = {
      ...customAttributes,
      email: payload.email,
      anonymous_id: payload.anonymous_id
    }

    if (createdAt) {
      body.created_at = createdAt
    }

    // Adding Object Person relationship if group_id exists in the call. If the object_type_id is not given, default it to "1"
    if (objectId) {
      body.cio_relationships = {
        action: 'add_relationships',
        relationships: [{ identifiers: { object_type_id: objectTypeId ?? '1', object_id: objectId } }]
      }
    }

    return request(`${trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.id}`, {
      method: 'put',
      json: body
    })
  }
}

export default action
