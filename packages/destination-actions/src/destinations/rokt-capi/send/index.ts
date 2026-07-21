import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send analytics data to Rokt CAPI.',
  fields,
  perform: (request, { payload }) => {
    return send(request, [payload], false)
  }, 
  performBatch: async (request, { payload }) => {
    return send(request, payload, true)
  }
}

export default action
