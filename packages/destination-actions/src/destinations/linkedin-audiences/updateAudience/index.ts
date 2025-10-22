import type { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { fields } from './fields'
import { SEGMENT_TYPES } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP User Segment',
  description: 'Syncs an Engage User based Audience to a LinkedIn DMP User Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, [payload],  SEGMENT_TYPES.USER, false, statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return send(request, settings, payload, SEGMENT_TYPES.USER, true, statsContext)
  }
}

export default action