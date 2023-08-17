import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { BASE_URL } from '../constants'
import type { GetTaxonomyResponse } from '../types'
import { gen_customer_taxonomy_payload, gen_segment_subtaxonomy_payload } from '../utils-tax'
import { Payload } from '../createSegment/generated-types'

export class YahooTaxonomy {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  // Fetches the entire taxonomy from Yahoo API
  // TODO finalize authentication as this endpoint requires Oauth1, but only
  // only server part (token pair is not required): https://developer.yahooinc.com/datax/guide/security-authentication/)
  async get_taxonomy(): Promise<ModifiedResponse<GetTaxonomyResponse>> {
    return this.request(`${BASE_URL}/v1/taxonomy`, {
      method: 'GET'
    })
  }

  async add_customer_taxonomy_node(settings: Settings, parent_id: string, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_customer_taxonomy_payload(settings, payload)
    })
  }

  async add_segment_subtaxonomy_node(parent_id: string, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_segment_subtaxonomy_payload(payload)
    })
  }
}
