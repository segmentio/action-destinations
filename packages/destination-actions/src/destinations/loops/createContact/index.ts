import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create a contact',
  description: 'Create a contact in Loops',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Contact Email',
      description: 'Email address for the contact.',
      type: 'string',
      format: 'email',
      required: true
    }
  },
  perform: (request, { payload }) => {
    return request('https://app.loops.so/api/v1/contacts/create', {
      method: 'post',
      json: {
        email: payload.email
      }
    })
  }
}

export default action
