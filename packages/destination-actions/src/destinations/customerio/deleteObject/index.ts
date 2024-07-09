import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Object',
  description: 'Delete an object in Customer.io.',
  defaultSubscription: 'event = "Object Deleted"',
  fields: {
    object_id: {
      label: 'Object ID',
      description: 'An object ID used to identify an object.',
      type: 'string',
      default: {
        '@path': '$.properties.objectId'
      }
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
        action: 'delete',
        payload,
        settings,
        type: 'object'
      }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, {
      action: 'delete',
      payload,
      settings,
      type: 'object'
    })
  }
}

export default action
