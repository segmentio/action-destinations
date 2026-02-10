import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'

const prepareJSON = (payload: Payload) => ({
  type: 'identify' as const,
  messageId: payload.messageId,
  userId: payload.userId,
  groupId: payload.groupId,
  traits: payload.traits,
  timestamp: payload.timestamp,
  context: payload.context
})

export const sendRequest = async (request: Function, settings: Settings, payload: Payload[]) => {
  return request(`${settings.apiEndpoint}/v1/batch`, {
    method: 'post',
    json: { batch: payload.map(prepareJSON) }
  })
}
