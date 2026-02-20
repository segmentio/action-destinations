import { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync To Amplitude Cohort',
  description: 'Sync Segment Audience to Amplitude Cohort',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields,
  perform: (request, { payload, settings }) => {
    return send(request, [payload], settings, false)
  },
  performBatch: (request, { payload, settings }) => {
    return send(request, payload, settings, true)
  }
}

export default action
