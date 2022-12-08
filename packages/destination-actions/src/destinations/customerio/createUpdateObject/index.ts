import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertAttributeTimestamps, convertValidTimestamp, trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Object',
  description: 'Create an object in Customer.io or update them if they exist.',
  defaultSubscription: 'type = "object"',
  fields: {
    id: {
      label: 'Object ID',
      description: 'The ID used to uniquely identify an object in Customer.io.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
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
      description: 'The ID used to relate user to an object in Customer.io.',
      type: 'string',
      default: {
        '@path': '$.userId'
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
    const userID = payload.user_id
    const objectID = payload.id
    if (payload.convert_timestamp !== false) {
      if (createdAt) {
        createdAt = convertValidTimestamp(createdAt)
      }

      if (customAttributes) {
        customAttributes = convertAttributeTimestamps(customAttributes)
      }
    }

    const body: Record<string, unknown> = {
      ...customAttributes
    }

    if (createdAt) {
      body.created_at = createdAt
    }
    body.type = 'object'
    body.action = 'identify'
    body.identifiers = { type_id: '1', id: objectID }
    body.cio_relationships = [{ identifiers: { id: userID } }]

    return request(`${trackApiEndpoint(settings.accountRegion)}/alpha-api/v2/profile`, {
      method: 'post',
      json: body
    })
  }
}

export default action
