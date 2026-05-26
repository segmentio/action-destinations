import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { send } from './functions'
import { audience_only_fields, profile_fields } from './fields'
import type { RawMapping } from './types'

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
  perform: async (request, data) => {
    const { payload, settings, rawMapping } = data
    return await send(request, [payload], settings, rawMapping as RawMapping)
  },
  performBatch: async (request, data) => {
    const { payload, settings, rawMapping } = data
    return await send(request, payload, settings, rawMapping as RawMapping)
  }
}

export default action