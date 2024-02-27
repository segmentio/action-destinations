import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { send } from '../util'

const action: ActionDefinition<Settings> = {
  title: 'Identify User',
  description: 'Forward identify, group, and alias events from Segment to PlayerZero.',
  fields: {},
  perform: (request, data) => {
    return send(request, data.settings, [data.payload], "identity")
  },
  performBatch: async (request, data) => {
    return send(request, data.settings, data.payload, "identity")
  },
}

export default action
