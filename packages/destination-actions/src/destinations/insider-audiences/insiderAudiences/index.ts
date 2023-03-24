import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  API_BASE,
  UPSERT_ENDPOINT,
  computedTraitsPayloadForIdentifyCall,
  computedTraitsPayloadForTrackCall
} from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Insider Audiences',
  description: '',
  fields: {},
  perform: (request, data) => {
    const computationClassName = data.rawData.context.personas.computation_class
    const type = data.rawData.type
    let ucdPayload = {}
    const requestPath = UPSERT_ENDPOINT

    if (computationClassName === 'trait' && type === 'identify') {
      ucdPayload = computedTraitsPayloadForIdentifyCall(data.rawData)
    } else if (computationClassName === 'trait' && type === 'track') {
      ucdPayload = computedTraitsPayloadForTrackCall(data.rawData)
    } else {
      throw new Error('This integration only supports identify and track calls from Segment Engage')
    }

    return request(`${API_BASE}${requestPath}`, { method: 'post', json: ucdPayload })
  }
}

export default action
