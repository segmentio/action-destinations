import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { send } from '../common-functions'
import { common_fields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Profile',
  description: 'Forward new or updated user profile to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "alias" or type = "track"',
  fields: {
    ...common_fields,
    previous_id: {
      label: 'Previous ID',
      type: 'string',
      description: "The user's previous ID, for alias events",
      default: {
        '@path': '$.previousId'
      }
    },
    email: {
      label: 'Email',
      description: 'The email address of the user.',
      type: 'string',
      format: 'email',
      required: {
        conditions: [{ fieldKey: 'previous_id', operator: 'is', value: undefined }]
      },
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      } 
    }
  },
  perform: async (request, { settings, payload }) => {
    return await send(request, [payload], settings)
  },
  performBatch: async (request, { settings, payload }) => {
    return await send(request, payload, settings)
  }
}

export default action
