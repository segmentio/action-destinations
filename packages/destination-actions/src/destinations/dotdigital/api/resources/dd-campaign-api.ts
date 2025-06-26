import { APIError, DynamicFieldResponse, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types';
import DDApi from '../dd-api';
import { Campaign, sendCampaignPayload } from '../types'

/**
   * Class representing the Dotdigital Campaign API.
   * Extends the base Dotdigital API class.
*/
class DDCampaignApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client);
  }

  /**
   * Gets campaigns with paging.
   * @param {number} select - Paging number of records to retrieve
   * @param {number} skip - Paging number of records to skip
   * @returns {Promise<object>} A promise that resolves to the response of the update operation.
   */
  async getCampaignsPaging (select = 1000, skip = 0) {
    return await this.get('/v2/campaigns', { select, skip })
  }

  /**
   * Fetches the list of campaigns from Dotdigital API.
   *
   * @returns A promise that resolves to a DynamicFieldResponse.
   */
  async getCampaigns (): Promise<DynamicFieldResponse> {
    const choices = []
    const select = 200
    let skip = 0

    let hasMoreData = true;
    while (hasMoreData) {
      try {
        const response: ModifiedResponse = await this.getCampaignsPaging(select, skip);
        const content: Campaign[] = JSON.parse(response.content);
        if (content.length === 0) {
          hasMoreData = false;
          break;
        } else {
          choices.push(...content.map((campaign: Campaign) => ({
            value: campaign.id.toString(),
            label: campaign.name
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
   * Sends an email campaign.
   * @param {number} campaignId - The campaign to send.
   * @param {number} contactId - The contact to send the campaign to.
   * @param {boolean} sendTimeOptimised - Optional flag to send at optimised time.
   * @param {string} sendDate - Optional send date.
   * @returns A promise that resolves to json.
   */
  public async sendCampaign(
    campaignId: number,
    contactId: number,
    sendDate?: string | number | undefined,
    sendTimeOptimised?: boolean,
  ) {

    try{
      const sendCampaignPayload: sendCampaignPayload = {
        campaignID: campaignId,
        contactIDs: [contactId],
        sendDate: sendDate
      }
      let endpoint = `/v2/campaigns/send`

      if(sendTimeOptimised) {
        endpoint = `/v2/campaigns/send-time-optimised`
        delete sendCampaignPayload.sendDate
      }

      const response: ModifiedResponse = await this.post(
        endpoint, sendCampaignPayload
      );
      return response;
    } catch (error) {
      throw error as APIError ?? 'Failed to send campaign';
    }
  }
}

export default DDCampaignApi;
