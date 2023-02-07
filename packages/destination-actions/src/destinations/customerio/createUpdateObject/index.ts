import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertAttributeTimestamps, convertValidTimestamp, trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Object',
  description: 'Create an object in Customer.io or update them if they exist.',
  defaultSubscription: 'type = "group"',
  fields: {
    id: {
      label: 'Object ID',
      description:
        'The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    created_at: {
      label: 'Created At',
      description: 'A timestamp of when the object was created.',
      type: 'string',
      default: {
        '@template': '{{traits.created_at}}'
      }
    },
    custom_attributes: {
      label: 'Object Attributes',
      description:
        'Optional attributes for the object. When updating an object, attributes are added or updated, not removed.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    user_id: {
      label: 'User ID',
      description:
        'The ID used to relate a user to an object in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An anonymous ID to relate to an object when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },

    object_type_id: {
      label: 'Object Type Id',
      description:
        'The ID used to uniquely identify a custom object type in Customer.io. [Learn more](https://customer.io/docs/object-relationships).',
      type: 'string',
      default: {
        '@path': '$.objectTypeId'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },
  perform: (request, { settings, payload }) => {
    let createdAt: string | number | undefined = payload.created_at
    let customAttributes = payload.custom_attributes
    const objectTypeID = payload.object_type_id
    const userID = payload.user_id
    const objectID = payload.id
    const anonymousId = payload.anonymous_id
    if (payload.convert_timestamp !== false) {
      if (createdAt) {
        createdAt = convertValidTimestamp(createdAt)
      }

      if (customAttributes) {
        customAttributes = convertAttributeTimestamps(customAttributes)
      }
    }

    const body: Record<string, unknown> = {}
    body.attributes = customAttributes
    if (createdAt) {
      body.created_at = createdAt
    }
    body.type = 'object'
    body.identifiers = { object_type_id: objectTypeID ?? '1', object_id: objectID }

    if (userID) {
      body.action = 'identify'
      body.cio_relationships = [{ identifiers: { id: userID } }]
    } else {
      body.action = 'identify_anonymous'
      body.cio_relationships = [{ identifiers: { anonymous_id: anonymousId } }]
    }

    return request(`${trackApiEndpoint(settings.accountRegion)}/api/v2/entity`, {
      method: 'post',
      json: body
    })
  }
}

export default action
