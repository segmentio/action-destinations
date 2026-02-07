import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { performSend } from './functions'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description:
    'Send events to Appcues. This action can send track, identify, and group events based on which fields are populated.',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields,
  perform: async (request, { payload, settings }) => {
    return performSend(request, payload, settings)
  }
}

export default action
