import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../constants'
import { required_user_id } from '../properties'
import { buildJSON, getPath } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Manage Subscriptions',
  description: 'Unsubscribe or resubscribe a user in Vero.',
  fields: {
    userId: required_user_id,
    subscriptionAction: {
      label: 'Subscription Action',
      description: 'Whether to unsubscribe or resubscribe the user.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Unsubscribe', value: 'unsubscribe' },
        { label: 'Resubscribe', value: 'resubscribe' }
      ]
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/users/${getPath(payload)}`, {
      method: 'post',
      json: buildJSON(payload)
    })
  }
}

export default action
