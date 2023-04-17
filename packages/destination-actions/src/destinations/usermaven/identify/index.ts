import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventRequestParams, resolveRequestPayload } from '../request-params'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity variables',
  platform: 'cloud',
  fields: {
    email: {
      type: 'string',
      required: true,
      description: 'The user email address',
      label: 'Email address',
      default: { '@path': '$.traits.email' }
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
