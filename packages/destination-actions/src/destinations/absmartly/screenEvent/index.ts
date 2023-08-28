import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultGoalFields, sendGoal } from '../goal'

const fields = { ...defaultGoalFields }
fields.name = {
  ...fields.name,
  default: {
    '@template': 'Screen: {{ name }}'
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Screen Event',
  description: 'Send Screen event to ABsmartly as a goal',
  fields,
  perform: (request, { payload, settings }) => {
    return sendGoal(request, payload, settings)
  }
}

export default action
