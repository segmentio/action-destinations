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
    user_email: {
      type: 'string',
      required: true,
      description: 'The user email address',
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.traits.user_email' },
          then: { '@path': '$.traits.user_email' },
          else: { '@path': '$.properties.user_email' }
        }
      }
    },
    user_created_at: {
      type: 'string',
      required: true,
      description: 'The timestamp when the user was created',
      label: 'Created at',
      default: { '@path': '$.traits.user_created_at' }
    },
    user_anonymous_id: {
      type: 'string',
      required: false,
      description: 'The user anonymous id',
      label: 'Anonymous id',
      default: { '@path': '$.anonymousId' }
    },
    user_first_name: {
      type: 'string',
      required: false,
      description: 'The user first name',
      label: 'First name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.user_first_name' },
          then: { '@path': '$.traits.user_first_name' },
          else: { '@path': '$.properties.user_first_name' }
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
          exists: { '@path': '$.traits.user_last_name' },
          then: { '@path': '$.traits.user_last_name' },
          else: { '@path': '$.properties.user_last_name' }
        }
      }
    },
    user_custom_attributes: {
      type: 'object',
      required: false,
      description: 'The user custom attributes',
      label: 'Custom attributes'
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
