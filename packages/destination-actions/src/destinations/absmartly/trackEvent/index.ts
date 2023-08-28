import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultGoalFields, sendGoal } from '../goal'
import { defaultExposureFields, sendExposure } from '../exposure'

const fields = { ...defaultGoalFields, ...defaultExposureFields }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send Track events to ABsmartly as a goal',
  fields: fields,
  perform: (request, { payload, settings }) => {
    if ((payload.exposureEventName?.length ?? 0) > 0 && payload.name === payload.exposureEventName) {
      if (payload.exposuresTracking) {
        return sendExposure(request, payload, settings)
      }
      return undefined
    }
    return sendGoal(request, payload, settings)
  }
}

export default action
