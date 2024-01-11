import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Suppress Person',
  description: `Track a "User Suppressed" event to suppress a person.`,
  defaultSubscription: 'event = "User Suppressed"',
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
    }
  },

  performBatch: (request, { payload: payloads, ...rest }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({
        ...rest,
        action: 'suppress',
        payload,
        type: 'person'
      }))
    )
  },

  perform: (request, { payload, ...rest }) => {
    return sendSingle(request, {
      ...rest,
      action: 'suppress',
      payload,
      type: 'person'
    })
  }
}

export default action
