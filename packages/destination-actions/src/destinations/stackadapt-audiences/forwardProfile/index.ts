import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { send } from '../common-functions'
import { common_fields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Profile',
  description: 'Forward new or updated user profiles to StackAdapt',
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
          else: { '@path': '$.context.traits.email' }
        }
      } 
    },
    standard_traits: {
      ...common_fields.standard_traits,
      default: {
        first_name: {
          '@if': {
            exists: { '@path': '$.traits.first_name' },
            then: { '@path': '$.traits.first_name' },
            else: { '@path': '$.context.traits.first_name' }
          }
        },
        last_name: {
          '@if': {
            exists: { '@path': '$.traits.last_name' },
            then: { '@path': '$.traits.last_name' },
            else: { '@path': '$.context.traits.last_name' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.context.traits.phone' }
          }
        },
        address: {
          '@if': {
            exists: { '@path': '$.traits.address.street' },
            then: { '@path': '$.traits.address.street' },
            else: { '@path': '$.context.traits.address.street' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.traits.address.city' },
            then: { '@path': '$.traits.address.city' },
            else: { '@path': '$.context.traits.address.city' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.traits.address.country' },
            then: { '@path': '$.traits.address.country' },
            else: { '@path': '$.context.traits.address.country' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.traits.address.state' },
            then: { '@path': '$.traits.address.state' },
            else: { '@path': '$.context.traits.address.state' }
          }
        },
        postal_code: {
          '@if': {
            exists: { '@path': '$.traits.address.postal_code' },
            then: { '@path': '$.traits.address.postal_code' },
            else: { '@path': '$.context.traits.address.postal_code' }
          }
        },
        timezone: {
          '@if': {
            exists: { '@path': '$.traits.timezone' },
            then: { '@path': '$.traits.timezone' },
            else: { '@path': '$.context.traits.timezone' }
          }
        },
        birth_date: {
          '@if': {
            exists: { '@path': '$.traits.birth_date' },
            then: { '@path': '$.traits.birth_date' },
            else: { '@path': '$.context.traits.birth_date' }
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, { settings, payload }) => {
    return await send(request, payload, settings, false)
  }
}

export default action
