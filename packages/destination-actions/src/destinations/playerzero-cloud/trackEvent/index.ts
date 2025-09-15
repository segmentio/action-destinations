import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { send } from '../util'

const action: ActionDefinition<Settings> = {
  title: 'Track Event',
  description: 'Forward page, screen, and track events from Segment to PlayerZero.',
  fields: {},
  perform: (request, data) => {
    return send(request, data.settings, [data.payload], 'event')
  },
  performBatch: async (request, data) => {
    return send(request, data.settings, data.payload, 'event')
  }
}

export default action
