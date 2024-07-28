import { DynamicFieldItem, DynamicFieldError, RequestClient } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { createHash } from 'crypto'
import { segmentSchemaKeyToArrayIndex, SCHEMA_PROPERTIES } from './fbca-properties'
import { IntegrationError } from '@segment/actions-core/*'

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

  syncAudience = async (input: { audienceId: string; payloads: Payload[]; deleteUsers?: boolean }) => {
    const data = this.generateData(input.payloads)
    console.log('data', data)

    const params = {
      payload: {
        schema: SCHEMA_PROPERTIES,
        data: data
      }
    }

    try {
      return await this.request(`${BASE_URL}${input.audienceId}/users`, {
        method: input.deleteUsers === true ? 'delete' : 'post',
        json: params
      })
    } catch (e) {
      return
    }
  }

  private generateData = (payloads: Payload[]): (string | number)[][] => {
    const data: (string | number)[][] = new Array(payloads.length)

    payloads.forEach((payload, index) => {
      const row: (string | number)[] = new Array(SCHEMA_PROPERTIES.length)

      Object.entries(payload).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([nestedKey, value]) => {
            this.appendToDataRow(nestedKey, value as string | number, row)
          })
        } else {
          this.appendToDataRow(key, value as string | number, row)
        }
      })

      data[index] = row
    })

    return data
  }

  private appendToDataRow = (key: string, value: string | number, row: (string | number)[]) => {
    const index = segmentSchemaKeyToArrayIndex.get(key)

    if (index === undefined) {
      throw new IntegrationError(`Invalid schema key: ${key}`, 'INVALID_SCHEMA_KEY', 500)
    }

    if (typeof value === 'number') {
      row[index] = value
      return
    }

    row[index] = this.hash(value)
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
