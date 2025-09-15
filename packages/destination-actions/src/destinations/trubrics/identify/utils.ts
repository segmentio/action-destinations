import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'

const prepareJSON = (payload: Payload) => {
  return {
    user_id: payload.user_id,
    timestamp: payload.timestamp,
    anonymous_id: payload.anonymous_id,
    traits: payload.traits
  }
}

export const sendRequest = async (request: Function, settings: Settings, payload: Payload[]) => {
  const json = payload.map(prepareJSON)

  return await request(`https://${settings.url}/identify_segment_users`, {
    method: 'post',
    headers: {
      'x-api-key': settings.apiKey
    },
    json
  })
}
