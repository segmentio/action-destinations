import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send identify calls to Hyperengage.',
  defaultSubscription: 'type = "identify"',
  platform: 'cloud',
  fields: {
    user_id: {
      type: 'string',
      required: true,
      description: 'The External ID of the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    name: {
      type: 'string',
      required: false,
      description: "The user's name",
      allowNull: true,
      label: 'Name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.name' },
          then: { '@path': '$.traits.name' },
          else: { '@path': '$.properties.name' }
        }
      }
    },
    first_name: {
      type: 'string',
      required: false,
      allowNull: true,
      description: "The user's first name. This field is mandatory if you're not providing a name field",
      label: 'First name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    last_name: {
      type: 'string',
      required: false,
      allowNull: true,
      description: "The user's last name. This field is mandatory if you're not providing a name field",
      label: 'Last name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "The user's email address",
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
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
    created_at: {
      type: 'string',
      required: false,
      description:
        'The timestamp when the user was created, represented in the ISO-8601 date format. For instance, "2023-09-26T15:30:00Z".',
      label: 'Created at',
      default: { '@path': '$.traits.created_at' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Properties to associate with the user',
      required: false,
      default: { '@path': '$.traits' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`https://events.hyperengage.io/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'user_identify')
    })
  }
}

export default action
