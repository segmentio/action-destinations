import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { RequestClient } from '@segment/actions-core'
const prepareJSON = (payload: Payload) => ({
  type: 'group' as const,
  messageId: payload.messageId,
  groupId: payload.groupId,
  userId: payload.userId,
  traits: payload.traits,
  timestamp: payload.timestamp,
  context: payload.context
})

export const sendRequest = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  return request(`${settings.apiEndpoint}/v1/batch`, {
    method: 'post',
    json: { batch: payload.map(prepareJSON) }
  })
}
