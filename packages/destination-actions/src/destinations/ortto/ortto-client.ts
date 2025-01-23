import { IntegrationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'

export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContacts = async (settings: Settings, payloads: UpsertContactPayload[]) => {
    const url = this.getEndpoint(settings.api_key).concat('/s')
    return this.request(url, {
      method: 'post',
      json: payloads
    })
  }

  private getEndpoint(apiKey: string): string {
    return 'http://localhost:8327'
    if (!apiKey) {
      throw new IntegrationError(`Invalid API key`, 'missing_api_key', 400)
    }
    const idx = apiKey.indexOf('-')
    if (idx != 3) {
      throw new IntegrationError(`Invalid API key`, 'invalid_format', 400)
    }

    let env = ''
    if (apiKey.charAt(0) == 's') {
      env = '-stg'
    }
    const region = apiKey.substring(1, idx).trim()
    if (region.length != 2) {
      throw new IntegrationError(`Invalid API key`, 'invalid_region', 400)
    }

    return `https://segment-action-api-${region}.ortto${env}.app`
  }
}
