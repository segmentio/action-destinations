import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const WORKER_URL = 'http://0.0.0.0:8787'

export default class Workers {
  actionName: string
  request: RequestClient

  constructor(actionName: string, request: RequestClient) {
    this.actionName = actionName
    this.request = request
  }

  sendPayload = async (payload: any, settings: Settings) => {
    return await this.request(`${WORKER_URL}/${this.actionName}`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      json: {
        payload: payload,
        settings: settings
      }
    })
  }
}
