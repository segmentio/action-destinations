import type { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Company Segment',
  description: 'Syncs an Engage Account based Audience to a LinkedIn DMP Company Segment.',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, [payload], statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, payload, statsContext)
  }
}

export default action