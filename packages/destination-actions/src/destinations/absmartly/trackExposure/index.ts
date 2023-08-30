import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultExposureFields, sendExposure } from '../exposure'

const fields = { ...defaultExposureFields }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Exposure',
  description: 'Send an experiment exposure event to ABsmartly',
  fields: fields,
  perform: (request, { payload, settings }) => {
    return sendExposure(request, payload, settings)
  }
}

export default action
