import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultGoalFields, GoalPayload, sendGoal } from '../goal'
import { RequestData } from '../segment'
import { unixTimestampOf } from '../timestamp'

const fields = { ...defaultGoalFields }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Goal',
  description: 'Send a goal event to ABsmartly',
  fields: fields,
  defaultSubscription: 'type = "track" and event != "Experiment Viewed"',
  perform: (request, data) => {
    const requestData = data as RequestData<Settings, GoalPayload>
    const timestamp = unixTimestampOf(requestData.rawData.timestamp)
    const payload = requestData.payload
    const settings = requestData.settings
    return sendGoal(request, timestamp, payload, settings)
  }
}

export default action
