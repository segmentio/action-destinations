import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { send } from './functions'
import { audience_only_fields, profile_fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage audience and user profile details to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    ...profile_fields,
    ...audience_only_fields,
    email: {
      label: 'Email',
      description: 'The email address of the user.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      } 
    }
  },
  perform: async (request, { payload, settings }) => {
    return await send(request, [payload], settings)
  },
  performBatch: async (request, { payload, settings }) => {
    return await send(request, payload, settings)
  }
}

export default action