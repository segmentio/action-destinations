import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { defaultExposureFields, ExposurePayload, sendExposure } from '../exposure'
import { RequestData } from '../segment'
import { unixTimestampOf } from '../timestamp'

const fields = { ...defaultExposureFields }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Exposure',
  description: 'Send an experiment exposure event to ABsmartly',
  fields: fields,
  defaultSubscription: 'type = "track" and event = "Experiment Viewed"',
  perform: (request, data) => {
    const requestData = data as RequestData<Settings, ExposurePayload>
    const timestamp = unixTimestampOf(requestData.rawData.timestamp)
    const payload = requestData.payload
    const settings = requestData.settings
    return sendExposure(request, timestamp, payload, settings)
  }
}

export default action
