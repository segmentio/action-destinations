import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultGoalFields, sendGoal } from '../goal'

const fields = { ...defaultGoalFields }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Goal',
  description: 'Send a goal event to ABsmartly',
  fields: fields,
  defaultSubscription: 'type = "track" and event != "Experiment Viewed"',
  perform: (request, { payload, settings }) => {
    return sendGoal(request, payload, settings)
  }
}

export default action
