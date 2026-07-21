import {
  InvalidAuthenticationError,
  PayloadValidationError,
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ErrorCodes
} from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as UpsertContactPayload } from './upsertContactProfile/generated-types'
import { Payload as EventPayload } from './trackActivity/generated-types'
import { cleanObject } from './utils'
import { Audience, BatchResponse } from './types'

export const API_VERSION = 'v1'
export const Success = {
  status: 200,
  body: 'Processed successfully'
}
export const Errors: Record<string, string> = {
  InvalidAPIKey: `Invalid API key`,
  MissingEventName: `Missing event name`,
  MissingAudienceName: `Missing audience name`,
  MissingAudienceId: `Missing audience Id`
}
export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
  }

  upsertContacts = async (
    settings: Settings,
    payloads: UpsertContactPayload[],
    hookAudienceID: string
  ): Promise<MultiStatusResponse> => {
    const response = new MultiStatusResponse()
    const cleaned: JSONLikeObject[] = []
    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      const clean = cleanObject(event) as JSONLikeObject
      if (hookAudienceID && (event.audience_update_mode === 'add' || event.audience_update_mode === 'remove')) {
        clean.audience = {
          mode: event.audience_update_mode,
          id: hookAudienceID
        }
      }
      cleaned.push(clean)
    }

    const url = this.getEndpoint(settings.api_key).concat('/identify')
    const { data } = await this.request<BatchResponse>(url, {
      method: 'POST',
      json: cleaned
    })

    cleaned.forEach((payload, idx) => {
      response.setSuccessResponseAtIndex(idx, {
        ...Success,
        sent: payload
      })
    })

    if (data.errors) {
      data.errors.forEach((err) => {
        const { status, message, index } = err
        response.setErrorResponseAtIndex(index, {
          status,
          errormessage: message,
          sent: cleaned[index]
        })
      })
    }

    return response
  }

  sendActivities = async (
    settings: Settings,
    payloads: EventPayload[],
    hookAudienceID: string
  ): Promise<MultiStatusResponse> => {
    const filtered: JSONLikeObject[] = []
    const indexBitmap: number[] = []
    const response = new MultiStatusResponse()

    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]
      const clean = cleanObject(event) as JSONLikeObject
      if (!event.event || event.event.trim() === '') {
        response.setErrorResponseAtIndex(i, {
          status: 400,
          sent: clean,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: Errors.MissingEventName
        })
        continue
      }
      if (event.namespace === 'ortto.com') {
        response.setSuccessResponseAtIndex(i, {
          status: 200,
          sent: clean,
          body: `${event.event} was originated from ${event.namespace} (Ignored)`
        })
        continue
      }

      if (hookAudienceID && (event.audience_update_mode === 'add' || event.audience_update_mode === 'remove')) {
        clean.audience = {
          mode: event.audience_update_mode,
          id: hookAudienceID
        }
      }
      filtered.push(clean)
      indexBitmap.push(i)
    }

    if (filtered.length == 0) {
      return response
    }
    const url = this.getEndpoint(settings.api_key).concat(`/track`)
    const { data } = await this.request<BatchResponse>(url, {
      method: 'POST',
      json: filtered
    })

    filtered.forEach((payload, idx) => {
      const originalIndex = indexBitmap[idx]
      response.setSuccessResponseAtIndex(originalIndex, {
        ...Success,
        sent: payload
      })
    })

    if (data.errors) {
      data.errors.forEach((err) => {
        const { status, message, index } = err
        const originalIndex = indexBitmap[index]
        response.setErrorResponseAtIndex(originalIndex, {
          status: status,
          errormessage: message,
          sent: filtered[index]
        })
      })
    }
    return response
  }

  testAuth = async (settings: Settings) => {
    const url = this.getEndpoint(settings.api_key).concat('/me')
    return this.request(url, {
      method: 'GET'
    })
  }

  createAudience = async (settings: Settings, audienceName: string): Promise<Audience> => {
    audienceName = audienceName?.trim()
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
