import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { TAXONOMY_BASE_URL } from '../constants'
import type { GetTaxonomyResponse } from '../types'
import { gen_customer_taxonomy_payload, gen_segment_subtaxonomy_payload } from '../utils-tax'
import { Payload } from '../createSegment/generated-types'
import { gen_oauth1_signature } from '../utils-tax'
export class YahooTaxonomy {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  /**
   * Fetches the entire taxonomy from Yahoo API via Oauth1
   * @returns The request to get taxonomy
   */
  async get_taxonomy(client_key: string, client_secret: string): Promise<ModifiedResponse<GetTaxonomyResponse>> {
    const oauth1_auth_string = gen_oauth1_signature(client_key, client_secret)
    return this.request(`${TAXONOMY_BASE_URL}/v1/taxonomy`, {
      method: 'GET',
      headers: {
        Authorization: oauth1_auth_string
      }
    })
  }

  /**
   * Adds a new node to the customer taxonomy.
   * @param settings The destination settings
   * @param parent_id The parent node ID
   * @param payload The payload
   * @returns The request to add the taxonomy node.
   */
  async add_customer_taxonomy_node(
    client_key: string,
    client_secret: string,
    settings: Settings,
    parent_id: string,
    payload: Payload
  ): Promise<ModifiedResponse> {
    const oauth1_auth_string = gen_oauth1_signature(client_key, client_secret)
    return this.request(`${TAXONOMY_BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_customer_taxonomy_payload(settings, payload),
      headers: {
        Authorization: oauth1_auth_string
      }
    })
  }

  /**
   * Adds a new node to the segment subtaxonomy.
   * @param parent_id The parent node ID
   * @param payload The payload
   * @returns The request to add the subtaxonomy node.
   */
  async add_segment_subtaxonomy_node(
    client_key: string,
    client_secret: string,
    parent_id: string,
    payload: Payload
  ): Promise<ModifiedResponse> {
    const oauth1_auth_string = gen_oauth1_signature(client_key, client_secret)
    return this.request(`${TAXONOMY_BASE_URL}/taxonomy/append/${parent_id}`, {
      method: 'PUT',
      json: gen_segment_subtaxonomy_payload(payload),
      headers: {
        Authorization: oauth1_auth_string
      }
    })
  }
}
