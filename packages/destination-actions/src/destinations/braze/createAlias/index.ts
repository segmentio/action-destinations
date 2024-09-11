import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const createAlias: ActionDefinition<Settings, Payload> = {
  title: 'Create Alias',
  description: 'Create new user aliases for existing identified users, or to create new unidentified users.',
  defaultSubscription: 'event = "Create Alias"',
  fields: {
    external_id: {
      label: 'External ID',
      description: 'The external ID of the user to create an alias for.',
      type: 'string',
      allowNull: true
    },
    alias_name: {
      label: 'Alias Name',
      description: 'The alias identifier',
      type: 'string',
      required: true
    },
    alias_label: {
      label: 'Alias Label',
      description: 'A label indicating the type of alias',
      type: 'string',
      required: true
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`${settings.endpoint}/users/alias/new`, {
      method: 'post',
      json: {
        user_aliases: [
          {
            external_id: payload.external_id ?? undefined,
            alias_name: payload.alias_name,
            alias_label: payload.alias_label
          }
        ]
      }
    })
  }
}

export default createAlias
