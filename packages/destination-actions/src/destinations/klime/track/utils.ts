import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { RequestClient } from '@segment/actions-core'
const prepareJSON = (payload: Payload) => ({
  type: 'track' as const,
  messageId: payload.messageId,
  event: payload.event,
  userId: payload.userId,
  groupId: payload.groupId,
  properties: payload.properties,
  timestamp: payload.timestamp,
  context: payload.context
})

export const sendRequest = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  return request(`${settings.apiEndpoint}/v1/batch`, {
    method: 'post',
    json: { batch: payload.map(prepareJSON) }
  })
}
