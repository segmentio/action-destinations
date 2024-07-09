import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertAttributeTimestamps, sendSingle, sendBatch, resolveIdentifiers } from '../utils'

type Action = 'identify' | 'identify_anonymous'

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
        '@if': {
          exists: { '@path': '$.traits.created_at' },
          then: { '@path': '$.traits.created_at' },
          else: { '@path': '$.traits.createdAt' }
        }
      }
    },
    custom_attributes: {
      label: 'Object Attributes',
      description:
        'Optional attributes for the object. When updating an object, attributes are added or updated, not removed.',
      type: 'object',
      default: {
        '@path': '$.traits.objectAttributes'
      }
    },
    relationship_attributes: {
      label: 'Relationship Attributes',
      description:
        'Optional attributes for the relationship between the object and the user. When updating an relationship, attributes are added or updated, not removed.',
      type: 'object',
      default: {
        '@path': '$.traits.relationshipAttributes'
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
        '@if': {
          exists: { '@path': '$.traits.object_type_id' },
          then: { '@path': '$.traits.object_type_id' },
          else: { '@path': '$.traits.objectTypeId' }
        }
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    const payloadsByAction: Record<Action, Record<string, unknown>[]> = {
      identify: [],
      identify_anonymous: []
    }

    for (const payload of payloads) {
      const { action, body } = mapPayload(payload)

      payloadsByAction[action as Action].push(body)
    }

    return Promise.all([
      sendBatch(
        request,
        payloadsByAction.identify.map((payload) => ({ action: 'identify', payload, settings, type: 'object' }))
      ),
      sendBatch(
        request,
        payloadsByAction.identify_anonymous.map((payload) => ({
          action: 'identify_anonymous',
          payload,
          settings,
          type: 'object'
        }))
      )
    ])
  },

  perform: (request, { payload, settings }) => {
    const { action, body } = mapPayload(payload)

    return sendSingle(request, { action, payload: body, settings, type: 'object' })
  }
}

function mapPayload(payload: Payload) {
  const {
    id,
    convert_timestamp,
    custom_attributes,
    relationship_attributes,
    user_id,
    anonymous_id,
    object_type_id,
    ...rest
  } = payload
  let body: Record<string, unknown> = {
    ...rest,
    anonymous_id,
    person_id: user_id,
    attributes: custom_attributes,
    object_type_id: object_type_id ?? '1',
    object_id: id
  }
  // Removes `object_type_id` and `relationshipAttributes` from the `custom_attributes` object because our API does not use these values.
  delete custom_attributes?.object_type_id
  delete custom_attributes?.objectTypeId
  delete custom_attributes?.relationshipAttributes

  let rel_attrs = relationship_attributes as Record<string, unknown>

  if ('convert_timestamp' in payload && convert_timestamp !== false) {
    body = convertAttributeTimestamps(body)
    if (relationship_attributes) {
      rel_attrs = convertAttributeTimestamps(rel_attrs)
    }
  }

  if ('created_at' in payload && !payload.created_at) {
    delete body.created_at
  }

  if (body.attributes && 'object_type_id' in (body.attributes as Record<string, unknown>)) {
    delete (body.attributes as Record<string, unknown>).object_type_id
  }

  let action = 'identify'

  if (user_id) {
    action = 'identify'
    const relationship: { [key: string]: unknown } = { identifiers: resolveIdentifiers({ person_id: user_id }) }
    // Adding relationship attributes if they exist
    if (relationship_attributes) {
      relationship.relationship_attributes = rel_attrs
    }
    body.cio_relationships = [relationship]
  } else if (anonymous_id) {
    action = 'identify_anonymous'
    const relationship: { [key: string]: unknown } = { identifiers: { anonymous_id } }
    // Adding relationship attributes if they exist
    if (relationship_attributes) {
      relationship.relationship_attributes = rel_attrs
    }
    body.cio_relationships = [relationship]
  }

  return { action, body }
}
export default action
