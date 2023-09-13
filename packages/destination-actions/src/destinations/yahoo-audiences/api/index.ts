import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { TAXONOMY_BASE_URL } from '../constants'
import type { GetTaxonomyResponse } from '../types'
import { gen_customer_taxonomy_payload, gen_segment_subtaxonomy_payload } from '../utils-tax'
import { Payload } from '../createSegment/generated-types'

export class YahooTaxonomy {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  /**
   * Fetches the entire taxonomy from Yahoo API
   * @returns
   * @todo finalize authentication as this endpoint requires Oauth1, but only
   * only server part (token pair is not required): https://developer.yahooinc.com/datax/guide/security-authentication/)
   */
  async get_taxonomy(): Promise<ModifiedResponse<GetTaxonomyResponse>> {
    return this.request(`${TAXONOMY_BASE_URL}/v1/taxonomy`, {
      method: 'GET'
    })
  }

  /**
   * Adds a new node to the customer taxonomy.
   * @param settings The destination settings
   * @param parent_id The parent node ID
   * @param payload The payload
   * @returns The request to add the taxonomy node.
   */
  async add_customer_taxonomy_node(settings: Settings, parent_id: string, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${TAXONOMY_BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_customer_taxonomy_payload(settings, payload)
    })
  }

  /**
   * Adds a new node to the segment subtaxonomy.
   * @param parent_id The parent node ID
   * @param payload The payload
   * @returns The request to add the subtaxonomy node.
   */
  async add_segment_subtaxonomy_node(parent_id: string, payload: Payload): Promise<ModifiedResponse> {
    return this.request(`${TAXONOMY_BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_segment_subtaxonomy_payload(payload)
    })
  }
}
