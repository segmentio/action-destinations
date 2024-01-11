import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { resolveIdentifiers, sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Relationship',
  description: `Track a "Relationship Deleted" event to delete a relationship.`,
  defaultSubscription: 'event = "Relationship Deleted"',
  fields: {
    person_id: {
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
      },
      required: true
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
        '@path': '$.groupId'
      },
      required: true
    },
    object_type_id: {
      label: 'Object Type ID',
      description: 'An object ID type used to identify the type of object.',
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

  performBatch: (request, { payload: payloads, ...rest }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({
        ...rest,
        action: 'delete_relationships',
        ...mapPayload(payload)
      }))
    )
  },

  perform: (request, { payload, ...rest }) => {
    return sendSingle(request, {
      ...rest,
      action: 'delete_relationships',
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
