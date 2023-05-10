import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-definitions'
import { eventRequestParams, resolveRequestPayload } from '../request-params'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Send pageview events to Usermaven.',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: 'The user id, to uniquely identify the user',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    user_email: {
      type: 'string',
      required: false,
      description: 'The user email address',
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    user_created_at: {
      type: 'string',
      required: false,
      description: 'The timestamp when the user was created',
      label: 'Created at',
      default: {
        '@if': {
          exists: { '@path': '$.properties.created_at' },
          then: { '@path': '$.properties.created_at' },
          else: { '@path': '$.context.traits.created_at' }
        }
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    // Resolve request params so that we can use the validated payload to send to Usermaven
    const resolvedPayload = resolveRequestPayload(settings, payload)

    // Get request params
    const { url, options } = eventRequestParams(settings, resolvedPayload, 'pageview')

    return request(url, options)
  }
}

export default action
