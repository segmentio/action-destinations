import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ActionDefinition } from '@segment/actions-core'
import { sendBatch, sendSingle } from '../utils'

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
        'An optional anonymous ID. This is used to tie anonymous events to this person. [Learn more](https://customer.io/docs/anonymous-events/).',
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
        '@if': {
          exists: { '@path': '$.traits.created_at' },
          then: { '@path': '$.traits.created_at' },
          else: { '@path': '$.traits.createdAt' }
        }
      }
    },
    group_id: {
      label: 'Object ID',
      description:
        'The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).',
      type: 'string',
      default: {
        '@path': '$.traits.objectId'
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
    relationship_attributes: {
      label: 'Relationship Attributes',
      description:
        'Optional attributes for the relationship between the object and the user. When updating an object, attributes are added or updated, not removed.',
      type: 'object',
      default: {
        '@path': '$.traits.relationshipAttributes'
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
        '@if': {
          exists: { '@path': '$.traits.object_type_id' },
          then: { '@path': '$.traits.object_type_id' },
          else: { '@path': '$.traits.objectTypeId' }
        }
      }
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({ action: 'identify', payload: mapPayload(payload), settings, type: 'person' }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, { action: 'identify', payload: mapPayload(payload), settings, type: 'person' })
  }
}

function mapPayload(payload: Payload) {
  const { id, custom_attributes = {}, relationship_attributes, created_at, group_id, object_type_id, ...rest } = payload

  // This is mapped to a field below.
  delete custom_attributes.createdAt
  delete custom_attributes.created_at
  delete custom_attributes?.object_type_id
  delete custom_attributes?.relationshipAttributes
  delete custom_attributes?.objectTypeId

  if (created_at) {
    custom_attributes.created_at = created_at
  }

  if (payload.email) {
    custom_attributes.email = payload.email
  }

  const body: Record<string, unknown> = {
    ...rest,
    person_id: id,
    attributes: custom_attributes
  }

  // Adding Object Person relationship if group_id exists in the call. If the object_type_id is not given, default it to "1"
  if (group_id) {
    const relationship: { [key: string]: unknown } = {
      identifiers: { object_type_id: object_type_id ?? '1', object_id: group_id }
    }
    // Adding relationship attributes if they exist
    if (relationship_attributes) {
      relationship.relationship_attributes = relationship_attributes
    }
    body.cio_relationships = [relationship]
  }

  return body
}

export default action
