import { DynamicFieldItem, DynamicFieldError, RequestClient, StatsContext } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { createHash } from 'crypto'
import { segmentSchemaKeyToArrayIndex, SCHEMA_PROPERTIES } from './fbca-properties'
import { Logger } from '@segment/actions-core/destination-kit'

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

interface SyncAudienceResponse {
  num_received: number
  num_invalid_entries: number
}

interface FacebookResponseError {
  error: {
    message: string
    type: string
    code: number
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

  if (typeof value === 'number') {
    row[index] = value
    return
  }

  row[index] = hash(value)
}

const hash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

export default class FacebookClient {
  request: RequestClient
  adAccountId: string
  stats?: StatsContext
  logger?: Logger

  constructor(request: RequestClient, adAccountId: string, stats?: StatsContext, logger?: Logger) {
    this.request = request
    this.adAccountId = this.formatAdAccount(adAccountId)
    this.stats = stats
    this.logger = logger
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

    const params = {
      payload: {
        schema: SCHEMA_PROPERTIES,
        data: data
      }
    }

    try {
      const res = await this.request<SyncAudienceResponse>(`${BASE_URL}${input.audienceId}/users`, {
        method: input.deleteUsers === true ? 'delete' : 'post',
        json: params
      })

      const totalPayload = input.payloads.length
      const totalSent = res.data.num_received
      const totalInvalid = res.data.num_invalid_entries
      this.stats?.statsClient.incr('syncAudience', totalPayload, this.stats?.tags)
      this.stats?.statsClient.incr('syncAudience.sent', totalSent, this.stats?.tags)
      this.stats?.statsClient.incr('syncAudience.invalid', totalInvalid, this.stats?.tags)

      this.logger?.error(`Facebook Custom Audiences: Total Payload: ${totalPayload}`)
      this.logger?.error(`Facebook Custom Audiences: Total Sent: ${totalSent}`)
      this.logger?.error(`Facebook Custom Audiences: Total Invalid: ${totalInvalid}`)

      return res
    } catch (e) {
      this.logger?.error(`Facebook Custom Audiences: Error: ${JSON.stringify(e)}`)
      this.logger?.error(`Facebook Custom Audiences: sample data: ${JSON.stringify(data[0])}`)
      throw e
    }
  }

  private formatAdAccount(adAccountId: string) {
    if (adAccountId.startsWith('act_')) {
      return adAccountId
    }
    return `act_${adAccountId}`
  }
}
