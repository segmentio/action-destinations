import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send Segment events to Attribution',
  defaultSubscription:
    'type = "track" or type = "page" or type = "screen" or type = "identify" or type = "group" or type = "alias"',
  fields,
  perform: (request, { payload }) => {
    return send(request, payload)
  }
}

export default action
