import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Company Segment',
  description: 'Syncs companies to LinkedIn DMP Company Segments.',
  defaultSubscription: 'type = "track"',
  fields,
  perform: async (request, { settings, payload, statsContext, stateContext, features }) => {
    return await send(request, settings, [payload], false, statsContext, stateContext, features)
  },
  performBatch: async (request, { settings, payload, statsContext, stateContext, features }) => {
    return await send(request, settings, payload, true, statsContext, stateContext, features)
  }
}

export default action
