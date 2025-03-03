import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'

const prepareJSON = (payload: Payload) => {
  return {
    event: payload.event,
    timestamp: payload.timestamp,
    user_id: payload.user_id,
    anonymous_id: payload.anonymous_id,
    llm_properties: payload.llm_properties,
    context: payload.context,
    properties: payload.properties
  }
}

export const sendRequest = async (request: Function, settings: Settings, payload: Payload[]) => {
  const json = payload.map(prepareJSON)

  return await request(`http://${settings.url}/publish_segment_events`, {
    method: 'post',
    headers: {
      'x-api-key': settings.apiKey
    },
    json
  })
}
