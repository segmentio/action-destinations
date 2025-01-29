import { IntegrationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'
import { Payload as EventPayload } from './trackActivity/generated-types'

export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContacts = async (settings: Settings, payloads: UpsertContactPayload[]) => {
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (!event.anonymous_id && !event.user_id) {
        throw new IntegrationError(`Either user ID or anonymous ID must be specified`, 'missing_id', 400)
      }
    }
    const url = this.getEndpoint(settings.api_key)
    return this.request(url, {
      method: 'POST',
      json: payloads
    })
  }

  sendActivities = async (settings: Settings, payloads: EventPayload[]) => {
    const filtered: EventPayload[] = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (!event.anonymous_id && !event.user_id) {
        throw new IntegrationError(`Either user ID or anonymous ID must be specified`, 'missing_id', 400)
      }
      if (event.namespace === 'ortto.com') {
        continue
      }
      filtered.push(event)
    }
    if (filtered.length == 0) {
      return
    }
    const url = this.getEndpoint(settings.api_key)
    return this.request(url, {
      method: 'POST',
      json: filtered
    })
  }

  testAuth = async (settings: Settings) => {
    const url = this.getEndpoint(settings.api_key)
    return this.request(url, {
      method: 'GET'
    })
  }

  private getEndpoint(apiKey: string): string {
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

    return `https://segment-action-api-${region}.ortto${env}.app/s`
  }
}
