import { DynamicFieldResponse, ModifiedResponse, RequestClient } from '@segment/actions-core'
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
  }
}

export default DDCampaignApi;
