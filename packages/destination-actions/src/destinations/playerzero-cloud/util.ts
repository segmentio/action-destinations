import { RequestClient } from '@segment/actions-core/dist/cjs'
import { Settings } from './generated-types'
import { Payload } from './forwardEvent/generated-types'

export const send = async (request: RequestClient, settings: Settings, payload: Payload[], type: string) => {
  // return request(`https://sdk.playerzero.app/connect/segment/${type}`, {
  return request(`http://localhost:9246/connect/segment/${type}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${settings.projectToken}`
    }
  })
}
