import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { send } from '../common-functions'
import { common_fields } from '../common-fields'
import { audience_only_fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage audience and user profile details to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    ...common_fields,
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
    return await send(request, [payload], settings, true)
  },
  performBatch: async (request, { payload, settings }) => {
    return await send(request, payload, settings, true)
  }
}

export default action