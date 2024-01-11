import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendSingle, sendBatch, resolveIdentifiers } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Merge People',
  description: 'Merge two customer profiles together.',
  defaultSubscription: 'type = "alias"',
  fields: {
    primary: {
      label: 'Primary User',
      description: `The person that you want to remain after the merge, identified by id, email or cio_id. This person receives information from the secondary person in the merge.`,
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    secondary: {
      label: 'Secondary User',
      description: `The person that you want to delete after the merge, identified by id, email or cio_id. This person's information is merged into the primary person's profile and then it is deleted.`,
      type: 'string',
      required: true,
      default: {
        '@path': '$.previousId'
      }
    }
  },

  performBatch: (request, { payload: payloads, ...rest }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({
        ...rest,
        action: 'merge',
        payload: mapPayload(payload),
        type: 'person'
      }))
    )
  },

  perform: (request, { payload, ...rest }) => {
    return sendSingle(request, {
      ...rest,
      action: 'merge',
      payload: mapPayload(payload),
      type: 'person'
    })
  }
}

function mapPayload(payload: Payload) {
  return {
    primary: resolveIdentifiers({ person_id: payload.primary }),
    secondary: resolveIdentifiers({ person_id: payload.secondary })
  }
}

export default action
