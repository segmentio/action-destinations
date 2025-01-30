import { InvalidAuthenticationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'
import { Payload as EventPayload } from './trackActivity/generated-types'

export const API_VERSION = 'v1'

export const Errors: Record<string, string> = {
  MissingIDs: `Either user ID or anonymous ID must be specified`,
  InvalidAPIKey: `Invalid API key`,
  MissingEventName: `Missing event name`
}
export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContacts = async (settings: Settings, payloads: UpsertContactPayload[]) => {
    const cleaned = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (!event.anonymous_id && !event.user_id) {
        throw new PayloadValidationError(Errors.MissingIDs)
      }
      cleaned.push(this.removeEmpty(event))
    }
    const url = this.getEndpoint(settings.api_key).concat('/identify')
    return this.request(url, {
      method: 'POST',
      json: payloads
    })
  }

  sendActivities = async (settings: Settings, payloads: EventPayload[]) => {
    const filtered = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (!event.anonymous_id && !event.user_id) {
        throw new PayloadValidationError(Errors.MissingIDs)
      }
      if (!event.event || event.event.trim() === '') {
        throw new PayloadValidationError(Errors.MissingEventName)
      }
      if (event.namespace === 'ortto.com') {
        continue
      }
      filtered.push(this.removeEmpty(event))
    }
    if (filtered.length == 0) {
      return
    }
    const url = this.getEndpoint(settings.api_key).concat(`/track`)
    return this.request(url, {
      method: 'POST',
      json: filtered
    })
  }

  testAuth = async (settings: Settings) => {
    const url = this.getEndpoint(settings.api_key).concat('/me')
    return this.request(url, {
      method: 'GET'
    })
  }

  private getEndpoint(apiKey: string): string {
    if (!apiKey) {
      throw new InvalidAuthenticationError(Errors.InvalidAPIKey)
    }
    const idx = apiKey.indexOf('-')
    if (idx != 3) {
      throw new InvalidAuthenticationError(Errors.InvalidAPIKey)
    }

    let env = ''
    if (apiKey.charAt(0) == 's') {
      env = '-stg'
    }
    const region = apiKey.substring(1, idx).trim()
    if (region.length != 2) {
      throw new InvalidAuthenticationError(Errors.InvalidAPIKey)
    }

    return `https://segment-action-api-${region}.ortto${env}.app/${API_VERSION}`
  }

  private removeEmpty<T extends {}>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key, value]) => key !== '' && value != null && value !== undefined)
        .map(([key, value]) => [key, value instanceof Object ? this.removeEmpty(value) : value])
        .filter(([_, value]) => !(typeof value === 'object' && value !== null && Object.keys(value).length === 0))
    ) as Partial<T>
  }
}
