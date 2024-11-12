import { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'

export class MolocoAPIClient {
  url: string
  platformId: string
  platformName: string
  apiKey: string

  request: RequestClient

  constructor(request: RequestClient, settings: Settings) {
    this.platformId = settings.platformId
    this.platformName = settings.platformName ?? ''
    this.apiKey = settings.apiKey
    this.request = request

    this.url = this.getEndpoint()
  }

  private getEndpoint() {
    const nameOrId = this.platformName ? this.platformName : this.platformId
    return `https://${nameOrId.replace(/_/g, '-')}-evt.rmp-api.moloco.com/cdp/SEGMENT`
  }

  async sendEvent(body: Record<string, any>): Promise<ModifiedResponse> {
    const headers = {
      'x-api-key': this.apiKey,
      'x-platform-id': this.platformId,
      'Content-Type': 'application/json'
    }

    return await this.request(this.url, {
      method: 'POST',
      headers,
      json: body
    })
  }
}
