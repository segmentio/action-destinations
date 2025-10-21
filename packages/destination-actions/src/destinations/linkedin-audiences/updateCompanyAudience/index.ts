import type { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { fields } from './fields'
import { SEGMENT_TYPES } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Company Segment',
  description: 'Syncs an Engage Account based Audience to a LinkedIn DMP Company Segment.',
  defaultSubscription: 'type = "identify"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, [payload], SEGMENT_TYPES.COMPANY, statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, payload, SEGMENT_TYPES.COMPANY, statsContext)
  }
}

export default action