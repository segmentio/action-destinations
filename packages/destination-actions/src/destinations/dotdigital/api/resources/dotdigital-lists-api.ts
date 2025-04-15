import {
  APIError,
  ModifiedResponse,
  RequestClient,
  DynamicFieldResponse
} from '@segment/actions-core';
import type { Settings } from '../../generated-types';
import DotdigitalApi from '../dotdigital-api';
import { List } from '../types'

class DotdigitalListsApi extends DotdigitalApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client);
  }

  /**
   * Gets address book lists.
   * @param {number} select - Paging number of records to retrieve
   * @param {number} skip - Paging number of records to skip
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async getListsPaging (select = 1000, skip = 0) {
    return await this.get('/v2/address-books', { select, skip })
  }

  /**
   * Fetches the list of lists from Dotdigital API.
   *
   * @returns A promise that resolves to a DynamicFieldResponse.
   */
  async getLists (): Promise<DynamicFieldResponse> {
    const choices = []
    const select = 200
    let skip = 0

    let hasMoreData = true;
    while (hasMoreData) {
      try {
        const response: ModifiedResponse = await this.getListsPaging(select, skip);
        const content: List[] = JSON.parse(response.content);
        // Explicitly type parsedContent
        if (content.length === 0) {
          hasMoreData = false;
          break;
        } else {
          choices.push(...content.map((list: List) => ({
            value: list.id.toString(),
            label: list.name
          })));
          skip += select;
        }
      } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      let errorCode = 'Unknown error';

      if (error instanceof APIError) {
        errorMessage = error.message ?? 'Unknown error';
        errorCode = error.status ? error.status.toString() : 'Unknown error';
      }

      return {
        choices: [],
        nextPage: '',
        error: {
          message: errorMessage,
          code: errorCode
        }
      };
    }
    }
    return {choices: choices}
  }

  /**
   * Deletes a contact from a specified list in Dotdigital API.
   *
   * @param listId - The ID of the list.
   * @param contactId - The ID of the contact to be deleted.
   *
   * @returns A promise that resolves when the contact is deleted.
   */
  async deleteContactFromList(
    listId: number,
    contactId: number
  ): Promise<void> {
    try {
      await this.delete(`/v2/address-books/${listId}/contacts/${contactId}`);
    } catch (error) {
      throw error as APIError ?? 'Failed to delete contact from list';
    }
  }
}

export default DotdigitalListsApi;
