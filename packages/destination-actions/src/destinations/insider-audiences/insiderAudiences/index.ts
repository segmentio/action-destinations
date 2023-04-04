import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  API_BASE,
  UPSERT_ENDPOINT,
  DELETE_ATTRIBUTE_ENDPOINT,
  computedTraitsPayloadForIdentifyCall,
  computedAudiencesPayloadForIdentifyCall,
  computedTraitsPayloadForTrackCall,
  computedAudiencePayloadForTrackCall,
  deleteAttributePartial
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
    } else if (computationClassName === 'audience' && type === 'track') {
      ucdPayload = computedAudiencePayloadForTrackCall(data.rawData)
    } else if (computationClassName === 'audience' && type === 'identify') {
      const computationKey = data.rawData.context.personas.computation_key
      const traitValue = data.rawData.traits[computationKey]

      if (!traitValue) {
        const partialDeletePayload = deleteAttributePartial(data.rawData)

        return request(`${API_BASE}${DELETE_ATTRIBUTE_ENDPOINT}`, { method: 'post', json: partialDeletePayload })
      }

      ucdPayload = computedAudiencesPayloadForIdentifyCall(data.rawData)
    } else {
      throw new Error('This integration only supports identify and track calls from Segment Engage')
    }

    return request(`${API_BASE}${requestPath}`, { method: 'post', json: ucdPayload })
  }
}

export default action
