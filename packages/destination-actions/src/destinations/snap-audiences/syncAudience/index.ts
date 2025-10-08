import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Engage Audiences to Snap',
  defaultSubscription: 'type = "track"',
  fields,
  perform: async (request, { payload }) => {
    return send(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return send(request, payload)
  }
}

export default action
