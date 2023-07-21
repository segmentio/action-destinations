import { RequestClient, RequestOptions } from '@segment/actions-core'
import { ModifiedResponse } from '@segment/actions-core'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'

export type AssertResponse = {
  data: {
    id: {
      workspace_id: string
      object_id: string
      record_id: string
    }
    created_at: string
    values: Record<string, Array<unknown>>
  }
}

interface ObjectResponse {
  api_slug: string
  singular_noun: string
}

export class AttioClient {
  private request: RequestClient
  private api_url: string

  constructor(request: RequestClient) {
    this.request = request
    this.api_url = 'https://api.attio.com'
  }

  /**
   * Either create or update a Record in the Attio system.
   *
   * @param matching_attribute The Attribute to match the Record on (e.g. an email address)
   * @param object The Attio Object (id / api_slug) that this Record should belong to (e.g. "people")
   * @param values The values of the Attributes to set on the Record
   * @param requestOptions Additional options for the request
   */
  async assertRecord({
    matching_attribute,
    object,
    values,
    requestOptions
  }: {
    matching_attribute: string
    object: string
    values: Record<string, unknown>
    requestOptions?: Partial<RequestOptions>
  }): Promise<ModifiedResponse<AssertResponse>> {
    return await this.request(
      `${this.api_url}/v2/objects/${object}/records/simple?matching_attribute=${matching_attribute}`,
      {
        method: 'put',
        json: { data: { values } },
        ...requestOptions
      }
    )
  }

  /**
   * List all of the available Objects in the Attio workspace.
   */
  async listObjects(): Promise<Array<ObjectResponse>> {
    const response = await this.request(`${this.api_url}/v2/objects`)
    const objects: Array<ObjectResponse> = get(response, 'data.data', [])

    return sortBy(objects, 'singular_noun')
  }
}
