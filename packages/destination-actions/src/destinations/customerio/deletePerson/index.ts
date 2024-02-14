import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Person',
  description: 'Delete a person in Customer.io.',
  defaultSubscription: 'event = "User Deleted"',
  fields: {
    person_id: {
      label: 'Person ID',
      description: 'The ID of the person that this mobile device belongs to.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
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
        type: 'person'
      }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, {
      action: 'delete',
      payload,
      settings,
      type: 'person'
    })
  }
}

export default action
