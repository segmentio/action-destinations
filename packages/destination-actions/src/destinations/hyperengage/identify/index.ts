import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify your user for Hyperengage',
  defaultSubscription: 'type = "identify"',
  platform: 'cloud',
  fields: {
    user_id: {
      type: 'string',
      required: true,
      description: 'External identifier for the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    name: {
      type: 'string',
      required: true,
      description: "The user's name",
      label: 'Name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.name' },
          then: { '@path': '$.traits.name' },
          else: { '@path': '$.properties.name' }
        }
      }
    },
    email: {
      type: 'string',
      required: false,
      description: 'The user email address',
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    created_at: {
      type: 'string',
      required: false,
      description: 'The timestamp when the user was created',
      label: 'Created at',
      default: { '@path': '$.traits.created_at' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the user',
      required: false,
      default: { '@path': '$.traits' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`https://t.jitsu.com/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'user_identify')
    })
  }
}

export default action
