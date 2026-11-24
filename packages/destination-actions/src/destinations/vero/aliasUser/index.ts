import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../constants'
import { buildJSON } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias User',
  description: 'Change the ID of an existing user in Vero.',
  defaultSubscription: 'type = "alias"',
  fields: {
    previousId: {
      label: 'Previous ID',
      description: 'The current ID of the user in Vero.',
      type: 'string',
      required: true,
      default: { '@path': '$.previousId' }
    },
    newId: {
      label: 'New ID',
      description: 'The new ID to assign to the user.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/users/reidentify`, {
      method: 'put',
      json: buildJSON(payload)
    })
  }
}

export default action
