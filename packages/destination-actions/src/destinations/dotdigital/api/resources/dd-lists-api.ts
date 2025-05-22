import { ModifiedResponse, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { List } from '../types'

class DDListsApi extends DDApi {
  constructor(settings: Settings, request: RequestClient) {
    super(settings, request)
  }

  /**
   * Gets address book lists.
   * @param {number} select - Paging number of records to retrieve
   * @param {number} skip - Paging number of records to skip
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async getListsPaging(select = 1000, skip = 0): Promise<ModifiedResponse<List[]>> {
    return await this.get<List[]>('/v2/address-books', { select, skip })
  }

  /**
   * Fetches the list of lists from Dotdigital API.
   *
   * @returns A promise that resolves to a DynamicFieldResponse.
   */
  async getLists(): Promise<DynamicFieldResponse> {
    const choices = []
    const select = 200
    let skip = 0

    let hasMoreData = true
    while (hasMoreData) {
      try {
        const response = await this.getListsPaging(select, skip)
        const content = response.data
        if (content.length === 0) {
          hasMoreData = false
          break
        } else {
          choices.push(
            ...content.map((list: List) => ({
              value: list.id.toString(),
              label: list.name
            }))
          )
          skip += select
        }
      } catch (error) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: 'Failed to fetch lists',
            code: 'LIST_FETCH_ERROR'
          }
        }
      }
    }
    return { choices: choices }
  }

  /**
   * Deletes a contact from a specified list in Dotdigital API.
   *
   * @param listId - The ID of the list.
   * @param contactId - The ID of the contact to be deleted.
   *
   * @returns A promise that resolves when the contact is deleted.
   */
  async deleteContactFromList(listId: number, contactId: number): Promise<void> {
    await this.delete(`/v2/address-books/${listId}/contacts/${contactId}`)
  }
}

export default DDListsApi
