import type { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './trackEvent/generated-types'

export const send = async (request: RequestClient, settings: Settings, payload: Payload[], type: string) => {
  return request(`https://sdk.playerzero.app/connect/segment/${type}`, {
    method: 'POST',
    json: payload,
    headers: {
      Authorization: `Bearer ${settings.projectToken}`
    }
  })
}
