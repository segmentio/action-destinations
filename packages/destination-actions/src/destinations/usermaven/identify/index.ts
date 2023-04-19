import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventRequestParams, resolveRequestPayload } from '../request-params'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets a user data.',
  platform: 'cloud',
  fields: {
    user_id: {
      type: 'string',
      required: true,
      description: 'The user id, to uniquely identify the user',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    user_email: {
      type: 'string',
      required: true,
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
    user_created_at: {
      type: 'string',
      required: false,
      description: 'The timestamp when the user was created',
      label: 'Created at',
      default: { '@path': '$.traits.created_at' }
    },
    user_first_name: {
      type: 'string',
      required: false,
      description: 'The user first name',
      label: 'First name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    user_last_name: {
      type: 'string',
      required: false,
      description: 'The user last name',
      label: 'Last name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    user_custom_attributes: {
      type: 'object',
      required: false,
      description: 'The user custom attributes',
      label: 'Custom attributes',
      default: {
        '@path': '$.traits'
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    // Resolve request params so that we can use the validated payload to send to Usermaven
    const resolvedPayload = resolveRequestPayload(settings, payload)

    // Get request params
    const { url, options } = eventRequestParams(settings, resolvedPayload, 'user_identify')

    return request(url, options)
  }
}

export default action
