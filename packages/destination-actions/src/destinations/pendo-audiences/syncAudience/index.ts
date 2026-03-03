import { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync to Pendo Segment',
  description: 'Sync Segment Engage Audience membership to a Pendo Segment by adding or removing visitors.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields,
  perform: (request, { payload }) => {
    return send(request, [payload], false)
  },
  performBatch: (request, { payload }) => {
    return send(request, payload, true)
  }
}

export default action
