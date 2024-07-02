import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { resolveIdentifiers, sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Relationship',
  description: `Delete a relationship between a person and an object in Customer.io.`,
  defaultSubscription: 'event = "Relationship Deleted"',
  fields: {
    person_id: {
      label: 'Person ID',
      description: 'The ID of the person that this mobile device belongs to.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
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
    object_id: {
      label: 'Object ID',
      description: 'An object ID used to identify an object.',
      type: 'string',
      default: {
        '@path': '$.properties.objectId'
      },
      required: true
    },
    object_type_id: {
      label: 'Object Type ID',
      description: 'An object ID type used to identify the type of object.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.object_type_id' },
          then: { '@path': '$.properties.object_type_id' },
          else: { '@path': '$.properties.objectTypeId' }
        }
      }
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({
        action: 'delete_relationships',
        settings,
        ...mapPayload(payload)
      }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, {
      action: 'delete_relationships',
      settings,
      ...mapPayload(payload)
    })
  }
}

function mapPayload(payload: Payload) {
  const { anonymous_id, person_id } = payload

  return {
    type: 'object',
    payload: {
      ...payload,
      cio_relationships: [
        {
          identifiers: resolveIdentifiers({ anonymous_id, person_id })
        }
      ]
    }
  }
}

export default action
