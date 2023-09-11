import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send an event to Hyperengage',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      type: 'string',
      required: true,
      description: 'The name of the event',
      label: 'Event name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The event properties',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    user_id: {
      type: 'string',
      required: false,
      description: 'The user id, to uniquely identify the user associated with the event',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    account_id: {
      type: 'string',
      required: false,
      description: 'The account id, to uniquely identify the account associated with the user',
      label: 'Account id',
      default: { '@path': '$.groupId' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`https://t.jitsu.com/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'track')
    })
  }
}

export default action
