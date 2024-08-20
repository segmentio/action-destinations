import { DynamicFieldItem, DynamicFieldError, RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { segmentSchemaKeyToArrayIndex, SCHEMA_PROPERTIES, normalizationFunctions } from './fbca-properties'
import { SmartHashing } from '@segment/actions-core'

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

interface FacebookSyncRequestParams {
  payload: {
    schema: string[]
    data: (string | number)[][]
    app_ids?: string[]
    page_ids?: string[]
  }
}

// exported for unit testing. Also why these are not members of the class
export const generateData = (payloads: Payload[]): (string | number)[][] => {
  const data: (string | number)[][] = new Array(payloads.length)

  payloads.forEach((payload, index) => {
    const row: (string | number)[] = new Array(SCHEMA_PROPERTIES.length).fill('')

    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([nestedKey, value]) => {
          appendToDataRow(nestedKey, value as string | number, row)
        })
      } else {
        appendToDataRow(key, value as string | number, row)
      }
    })

    data[index] = row
  })

  return data
}

const appendToDataRow = (key: string, value: string | number, row: (string | number)[]) => {
  const index = segmentSchemaKeyToArrayIndex.get(key)

  if (index === undefined) {
    // ignore batch related keys
    return
  }

  const smartHash = new SmartHashing('sha256')

  if (typeof value === 'number' || ['externalId', 'mobileAdId'].includes(key) || smartHash.isAlreadyHashed(value)) {
    row[index] = value
    return
  }

  const normalizationFunction = normalizationFunctions.get(key)
  if (!normalizationFunction) {
    throw new IntegrationError(`Normalization function not found for key: ${key}`, `cannot normalize ${key}`, 500)
  }

  const normalizedValue = normalizationFunction(value)
  row[index] = smartHash.hash(normalizedValue)
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
    const data = generateData(input.payloads)

    const app_ids: string[] = []
    let app_ids_items = 0
    input.payloads.forEach((payload) => {
      if (payload.appId !== undefined) {
        app_ids_items++
        app_ids.push(payload.appId)
      } else {
        app_ids.push('')
      }
    })

    const page_ids: string[] = []
    let page_ids_items = 0
    input.payloads.forEach((payload) => {
      if (payload.pageId !== undefined) {
        page_ids_items++
        page_ids.push(payload.pageId)
      } else {
        page_ids.push('')
      }
    })

    const params: FacebookSyncRequestParams = {
      payload: {
        schema: SCHEMA_PROPERTIES,
        data: data
      }
    }

    if (app_ids_items > 0) {
      params.payload.app_ids = app_ids
    }

    if (page_ids_items > 0) {
      params.payload.page_ids = page_ids
    }

    return await this.request(`${BASE_URL}${input.audienceId}/users`, {
      method: input.deleteUsers === true ? 'delete' : 'post',
      json: params
    })
  }

  private formatAdAccount(adAccountId: string) {
    if (adAccountId.startsWith('act_')) {
      return adAccountId
    }
    return `act_${adAccountId}`
  }
}
