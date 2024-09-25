import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Alias V2',
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
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to add Aliases',
    default: 'add',
    choices: [{ label: 'Create Alias', value: 'add' }]
  },
  perform: (request, { settings, payload, syncMode }) => {
    if (syncMode === 'add') {
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

    throw new IntegrationError('syncMode must be "add"', 'Invalid syncMode', 400)
  }
}

export default action
