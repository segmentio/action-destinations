import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventRequestParams, resolveRequestPayload } from '../request-params'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: '',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    event_attributes: {
      type: 'string',
      required: false,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.properties' }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    // Resolve request params so that we can use the validated payload to send to Usermaven
    const resolvedPayload = resolveRequestPayload(settings, payload)

    // Get request params
    const { url, options } = eventRequestParams(settings, resolvedPayload)

    return request(url, options)
  }
}

export default action
