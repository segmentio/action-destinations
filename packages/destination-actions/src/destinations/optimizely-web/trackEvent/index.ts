import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './utils'  

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send a Segment track or page event to Optimizely',
  defaultSubscription: 'type = "track" or type = "page"',
  fields,
  perform: async (request, { payload, settings }) => {
    return await send(request, settings, payload)
  }
}

export default action
