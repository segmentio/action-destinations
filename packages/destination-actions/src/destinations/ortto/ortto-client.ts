import { InvalidAuthenticationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'
import { Payload as EventPayload } from './trackActivity/generated-types'
import { cleanObject } from './utils'
import { Audience } from './types'

export const API_VERSION = 'v1'

export const Errors: Record<string, string> = {
  InvalidAPIKey: `Invalid API key`,
  MissingEventName: `Missing event name`,
  MissingAudienceName: `Missing audience name`,
  MissingAudienceId: `Missing audience Id`,
  MissingContactID: `At least one contact Id must be provided`
}
export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContacts = async (settings: Settings, payloads: UpsertContactPayload[], hookAudienceID: string) => {
    const cleaned: Partial<UpsertContactPayload>[] = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (hookAudienceID && (event.audience_update_mode === 'add' || event.audience_update_mode === 'remove')) {
        event.audience = {
          mode: event.audience_update_mode,
          id: hookAudienceID
        }
      }
      cleaned.push(cleanObject(event))
    }
    if (cleaned.length == 0) {
      return
    }
    const url = this.getEndpoint(settings.api_key).concat('/identify')
    return this.request(url, {
      method: 'POST',
      json: cleaned
    })
  }

  sendActivities = async (settings: Settings, payloads: EventPayload[], hookAudienceID: string) => {
    const filtered: Partial<EventPayload>[] = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      if (!event.event || event.event.trim() === '') {
        throw new PayloadValidationError(Errors.MissingEventName)
      }
      if (event.namespace === 'ortto.com') {
        continue
      }
      if (hookAudienceID && (event.audience_update_mode === 'add' || event.audience_update_mode === 'remove')) {
        event.audience = {
          mode: event.audience_update_mode,
          id: hookAudienceID
        }
      }
      filtered.push(cleanObject(event))
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

  // Audiences

  createAudience = async (settings: Settings, audienceName: string): Promise<Audience> => {
    if (!audienceName) {
      throw new PayloadValidationError(Errors.MissingAudienceName)
    }
    const url = this.getEndpoint(settings.api_key).concat('/audiences/create')
    const { data } = await this.request<Audience>(url, {
      method: 'POST',
      json: { name: audienceName }
    })
    return data
  }

  getAudience = async (settings: Settings, audienceId: string): Promise<Audience> => {
    if (!audienceId) {
      throw new PayloadValidationError(Errors.MissingAudienceId)
    }

    const url = this.getEndpoint(settings.api_key).concat('/audiences/get')
    const { data } = await this.request<Audience>(url, {
      method: 'POST',
      json: { id: audienceId }
    })

    return data
  }

  // Audiences END

  private getEndpoint(apiKey: string): string {
    if (process?.env?.ORTTO_LOCAL_ENDPOINT) {
      return `${process?.env?.ORTTO_LOCAL_ENDPOINT}/${API_VERSION}`
    }
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
}
