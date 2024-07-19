import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getHost } from '../utils'
import { RequestClient } from '@segment/actions-core'

export interface Data {
  payload:
    | Payload[]
    | (Payload & {
        context?: {
          [k: string]: unknown
          personas?: {
            computation_key?: string
            computation_class?: string
          }
        }
      })
  settings: Settings
  rawData?: {
    context?: {
      personas?: {
        computation_key?: string
        computation_class?: string
      }
    }
    properties?: Record<string, boolean>
    traits?: Record<string, boolean>
  }
}

export class OptimizelyClient {
  request: RequestClient
  payloads: Payload[]
  settings: Settings
  data: Data

  constructor(request: RequestClient, data: Data) {
    this.request = request
    this.payloads = Array.isArray(data.payload) ? data.payload : [data.payload]
    this.settings = data.settings
    this.data = data
  }

  async send() {
    const host = getHost(this.settings)

    const requestBody = this.payloads.map((payload) => {
      return {
        audienceId: payload.segment_computation_id,
        audienceName: payload.custom_audience_name,
        timestamp: payload.timestamp,
        subscription:
          this.data?.rawData?.properties?.[payload.custom_audience_name] ??
          this.data?.rawData?.traits?.[payload.custom_audience_name],
        userId: payload.optimizelyUserId
      }
    })

    return this.request(`${host}/batch_sync_audience`, {
      method: 'post',
      json: requestBody
    })
  }
}
