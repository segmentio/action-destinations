import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send track calls to Hyperengage.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      type: 'string',
      required: true,
      description: 'The name of the event',
      label: 'Event name',
      default: { '@path': '$.event' }
    },
    user_id: {
      type: 'string',
      required: true,
      description: 'The user id, to uniquely identify the user associated with the event',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The properties of the track call',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    account_id: {
      type: 'string',
      required: false,
      description: 'The account id, to uniquely identify the account associated with the user',
      label: 'Account id',
      default: {
        '@if': {
          exists: { '@path': '$.context.group_id' },
          then: { '@path': '$.context.group_id' },
          else: { '@path': '$.groupId' }
        }
      }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`https://events.hyperengage.io/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'track')
    })
  }
}

export default action
