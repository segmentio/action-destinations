import { DynamicFieldItem, DynamicFieldError, RequestClient } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { API_VERSION, BASE_URL } from './constants'

interface AudienceResponse {
  advertiser_id: string
  custom_attributes: string
  id: string
  id_in_integration: string
  integration_type: string
  name: string
  segment_info: null
  tenant_id: string
}

interface VibeResponseError {
  error: {
    message: string
    code: string
  }
}

export default class VibeClient {
  request: RequestClient
  advertiserId: string
  authToken: string
  baseUrl: string

  constructor(request: RequestClient, advertiserId: string, authToken: string) {
    this.request = async (url: string, options: Record<string, any> = {}) => {
      options.headers = options.headers || {}
      if (!options.headers['x-api-key']) {
        options.headers['x-api-key'] = authToken
      }
      return request(url, options)
    }
    this.advertiserId = advertiserId
    this.authToken = authToken
    this.baseUrl = BASE_URL
  }

  createAudience = async (name: string) => {
    return await this.request<AudienceResponse>(
      `${this.baseUrl}/${API_VERSION}/webhooks/twilio/${this.advertiserId}/audience`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          name
        }
      }
    )
  }

  getSingleAudience = async (audienceId: string): Promise<{ data?: AudienceResponse; error?: VibeResponseError }> => {
    try {
      const { data } = await this.request<AudienceResponse>(
        `${this.baseUrl}/${API_VERSION}/webhooks/twilio/${this.advertiserId}/audiences/${audienceId}`
      )
      return { data, error: undefined }
    } catch (error) {
      return { data: undefined, error: error as VibeResponseError }
    }
  }

  getAllAudiences = async (): Promise<{ choices: DynamicFieldItem[]; error: DynamicFieldError | undefined }> => {
    const { data } = await this.request<AudienceResponse[]>(
      `${this.baseUrl}/${API_VERSION}/webhooks/twilio/${this.advertiserId}/audiences`
    )

    const choices = data.map(({ id, name }) => ({
      value: id,
      label: name
    }))

    return {
      choices,
      error: undefined
    }
  }

  syncAudience = async (input: { audienceId: string; payloads: Payload[]; deleteUsers?: boolean }) => {
    // Extract emails from payloads
    const emails = input.payloads.map((payload) => payload.email).filter(Boolean)

    return await this.request(
      `${this.baseUrl}/${API_VERSION}/webhooks/twilio/${this.advertiserId}/audience/${input.audienceId}/sync`,
      {
        method: input.deleteUsers === true ? 'delete' : 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          emails
        }
      }
    )
  }
}
