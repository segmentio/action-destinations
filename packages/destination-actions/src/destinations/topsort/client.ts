import { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { TOPSORT_API_VERSION } from '../versioning-info'

export class TopsortAPIClient {
  url: string
  apiKey: string

  request: RequestClient

  constructor(request: RequestClient, settings: Settings) {
    this.apiKey = settings.api_key
    this.request = request

    this.url = this.getEndpoint()
  }

  private getEndpoint() {
    return `https://api.topsort.com/${TOPSORT_API_VERSION}/events`
  }

  async sendEvent(body: Record<string, unknown>): Promise<ModifiedResponse> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }

    return await this.request(this.url, {
      method: 'POST',
      headers,
      json: body
    })
  }
}
