import { IntegrationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'

export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContact = async (settings: Settings, payload: UpsertContactPayload) => {
    const url = this.getEndpoint(settings.region)
    return this.request(url, {
      method: 'post',
      json: payload
    })
  }

  upsertContacts = async (settings: Settings, payloads: UpsertContactPayload[]) => {
    const url = this.getEndpoint(settings.region)
    return this.request(url, {
      method: 'post',
      json: payloads
    })
  }

  private getEndpoint(region: string): string {
    if (region == '' || region == undefined) {
      throw new IntegrationError(`Undefined region`, 'Undefined region', 400)
    }
    if (region == 'local') {
      return 'https://alexg-inspect.frp-http.ortto.dev/'
    }
    return `https://segment-integration-api-${region}.ortto.app/`
  }
}
