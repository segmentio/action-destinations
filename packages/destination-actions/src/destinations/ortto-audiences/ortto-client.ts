import {
  InvalidAuthenticationError,
  PayloadValidationError,
  RequestClient,
  MultiStatusResponse,
  ErrorCodes
} from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload } from './syncAudience/generated-types'
import { cleanObject } from './utils'
import { Audience, BatchResponse, SyncAudienceRequest } from './types'

export const API_VERSION = 'v1'
export const Success = {
  status: 200,
  body: 'Processed successfully'
}
export const Errors: Record<string, string> = {
  InvalidAPIKey: `Invalid API key`,
  MissingAudienceName: `Missing audience name`,
  MissingAudienceId: `Missing audience Id`
}
export default class OrttoClient {
  request: RequestClient
  constructor(request: RequestClient) {
    this.request = request
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

  getAudience = async (settings: Settings, audienceId: string): Promise<Audience> => {
    audienceId = audienceId?.trim()
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

  syncAudience = async (settings: Settings, payloads: Payload[]): Promise<MultiStatusResponse> => {
    const filtered: SyncAudienceRequest[] = []
    const indexBitmap: number[] = []
    const response = new MultiStatusResponse()

    for (let i = 0; i < payloads.length; i++) {
      const event = payloads[i]

      if (!event.external_audience_id) {
        response.setErrorResponseAtIndex(i, {
          status: 400,
          sent: JSON.stringify(event),
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: Errors.MissingAudienceId
        })
        continue
      }

      const computedValue = event.traits[event.computation_key]
      const sanitisedTraits = cleanObject(event.traits)
      delete sanitisedTraits[event.computation_key]
      const req: SyncAudienceRequest = {
        message_id: event.message_id,
        user_id: event.user_id,
        anonymous_id: event.anonymous_id,
        ip: event.ip,
        location: event.location,
        audience: {
          mode: computedValue === true ? 'add' : 'remove',
          id: event.external_audience_id
        },
        traits: sanitisedTraits
      }
      filtered.push(req)
      indexBitmap.push(i)
    }

    if (filtered.length == 0) {
      return response
    }
    const url = this.getEndpoint(settings.api_key).concat('/audiences/members')
    const { data } = await this.request<BatchResponse>(url, {
      method: 'PUT',
      json: filtered
    })

    filtered.forEach((payload, idx) => {
      const originalIndex = indexBitmap[idx]
      response.setSuccessResponseAtIndex(originalIndex, {
        ...Success,
        sent: JSON.stringify(payload)
      })
    })

    if (data.errors) {
      data.errors.forEach((err) => {
        const { status, message, index } = err
        const originalIndex = indexBitmap[index]
        response.setErrorResponseAtIndex(originalIndex, {
          status: status,
          errormessage: message,
          sent: JSON.stringify(filtered[index])
        })
      })
    }
    return response
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
