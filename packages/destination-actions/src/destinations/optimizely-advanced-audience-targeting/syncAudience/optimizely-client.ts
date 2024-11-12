import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getHost } from '../utils'
import { RequestClient } from '@segment/actions-core'

interface PropsOrTraits {
  properties?: Record<string, boolean>
  traits?: Record<string, boolean>
}

export interface Data {
  payload: Payload | Array<Payload>
  settings: Settings
  rawData: PropsOrTraits | Array<PropsOrTraits>
}

export class OptimizelyClient {
  request: RequestClient
  payloads: Payload[]
  settings: Settings
  propsOrTraits: PropsOrTraits[]

  constructor(request: RequestClient, data: Data) {
    this.request = request
    this.settings = data.settings
    this.payloads = Array.isArray(data.payload) ? data.payload : [data.payload]
    this.propsOrTraits = Array.isArray(data.rawData) ? data.rawData : [data.rawData]
  }

  async send() {
    const host = getHost(this.settings)

    const requestBody = this.payloads.map((payload, index) => {
      return {
        audienceId: payload.segment_computation_id,
        audienceName: payload.custom_audience_name,
        timestamp: payload.timestamp,
        subscription:
          this.propsOrTraits[index].properties?.[payload.custom_audience_name] ??
          this.propsOrTraits[index].traits?.[payload.custom_audience_name],
        userId: payload.optimizelyUserId
      }
    })

    return this.request(`${host}/batch_sync_audience`, {
      method: 'post',
      json: requestBody
    })
  }
}
