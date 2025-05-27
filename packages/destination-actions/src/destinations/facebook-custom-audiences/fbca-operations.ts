import { DynamicFieldItem, DynamicFieldError, RequestClient, Features } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { segmentSchemaKeyToArrayIndex, SCHEMA_PROPERTIES, normalizationFunctions } from './fbca-properties'
import { processHashing } from '../../lib/hashing-utils'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { API_VERSION, BASE_URL, CANARY_API_VERSION, FACEBOOK_CUSTOM_AUDIENCE_FLAGON } from './constants'

// exported for unit testing

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

  if (typeof value === 'number' || ['externalId', 'mobileAdId'].includes(key)) {
    row[index] = value
    return
  }

  row[index] = processHashing(value, 'sha256', 'hex', normalizationFunctions.get(key))
}

export const getApiVersion = (features?: Features, statsContext?: StatsContext): string => {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  const version = features && features[FACEBOOK_CUSTOM_AUDIENCE_FLAGON] ? CANARY_API_VERSION : API_VERSION
  tags?.push(`version:${version}`)
  statsClient?.incr(`actions_facebook_custom_audience`, 1, tags)
  return version
}

export default class FacebookClient {
  request: RequestClient
  adAccountId: string
  features: Features | undefined
  baseUrl: string

  constructor(request: RequestClient, adAccountId: string, features?: Features, statsContext?: StatsContext) {
    this.request = request
    this.adAccountId = this.formatAdAccount(adAccountId)
    this.baseUrl = `${BASE_URL}/${getApiVersion(features, statsContext)}/`
    this.features = features || undefined
  }

  createAudience = async (name: string) => {
    return await this.request<AudienceCreationResponse>(`${this.baseUrl}${this.adAccountId}/customaudiences`, {
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
      const { data } = await this.request<GetSingleAudienceResponse>(`${this.baseUrl}${audienceId}${fields}`)
      return { data, error: undefined }
    } catch (error) {
      return { data: undefined, error: error as FacebookResponseError }
    }
  }

  getAllAudiences = async (): Promise<{ choices: DynamicFieldItem[]; error: DynamicFieldError | undefined }> => {
    const { data } = await this.request<GetAllAudienceResponse>(
      `${this.baseUrl}${this.adAccountId}/customaudiences?fields=id,name&limit=200`
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

    return await this.request(`${this.baseUrl}${input.audienceId}/users`, {
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
