import { DynamicFieldItem, DynamicFieldError, RequestClient } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { audienceId } from '../talon-one/t1-properties'
import { createHash } from 'crypto'

const FACEBOOK_API_VERSION = 'v20.0'
// exported for unit testing
export const BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/`

interface AudienceCreationResponse {
  id: string
}

interface GetAllAudienceResponse {
  data: {
    id: string
    name: string
  }[]
}

interface GetSingleAudienceResponse {
  name: string
  id: string
}

interface FacebookResponseError {
  error: {
    message: string
    type: string
    code: number
  }
}

export default class FacebookClient {
  request: RequestClient
  adAccountId: string

  constructor(request: RequestClient, adAccountId: string) {
    this.request = request
    this.adAccountId = this.formatAdAccount(adAccountId)
  }

  createAudience = async (name: string) => {
    return await this.request<AudienceCreationResponse>(`${BASE_URL}${this.adAccountId}/customaudiences`, {
      method: 'post',
      json: {
        name,
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      }
    })
  }

  getSingleAudience = async (
    audienceId: string
  ): Promise<{ data?: GetSingleAudienceResponse; error?: FacebookResponseError }> => {
    try {
      const fields = '?fields=id,name'
      const { data } = await this.request<GetSingleAudienceResponse>(`${BASE_URL}${audienceId}${fields}`)
      return { data, error: undefined }
    } catch (error) {
      return { data: undefined, error: error as FacebookResponseError }
    }
  }

  getAllAudiences = async (): Promise<{ choices: DynamicFieldItem[]; error: DynamicFieldError | undefined }> => {
    const { data } = await this.request<GetAllAudienceResponse>(
      `${BASE_URL}${this.adAccountId}/customaudiences?fields=id,name&limit=200`
    )

    const choices = data.data.map(({ id, name }) => ({
      value: id,
      label: name
    }))

    return {
      choices,
      error: undefined
    }
  }

  syncAudience = async (input: { audienceId: string; payload: Payload[] }) => {
    const schema = this.generateSchema(input.payload)
    const data = this.generateData(schema, input.payload)

    const params = {
      payload: {
        schema: schema,
        data: data
      }
    }
    console.log('params', JSON.stringify(params))

    console.log('audienceId', input.audienceId)

    try {
      return await this.request(`${BASE_URL}${audienceId}/users`, {
        method: 'post',
        json: params
      })
    } catch (e) {
      console.log('error', e)
      return
    }
  }

  private generateSchema = (payloads: Payload[]): string[] => {
    const schema = new Set<string>()
    payloads.forEach((payload) => {
      Object.keys(payload).forEach((key) => {
        schema.add(key.toUpperCase())
      })
    })

    return Array.from(schema)
  }

  private generateData = (schema: string[], payloads: Payload[]) => {
    const data: (string | number)[][] = []

    payloads.forEach((payload) => {
      console.log('payload', payload)
      const row: string[] = []
      schema.forEach((key) => {
        console.log('key', key)
        const value = payload[key.toLowerCase() as keyof Payload]
        console.log('value', value)
        row.push(this.hash(value) || '')
      })
      data.push(row)
    })

    return data
  }

  private hash = (value: string): string => {
    return createHash('sha256').update(value).digest('hex')
  }

  private formatAdAccount(adAccountId: string) {
    if (adAccountId.startsWith('act_')) {
      return adAccountId
    }
    return `act_${adAccountId}`
  }
}
