import { APIError, ModifiedResponse, RequestClient } from '@segment/actions-core';
import type { Settings } from '../../generated-types';
import DDApi from '../dd-api';
import { checkAndCleanMobileNumber } from '../../helpers/functions'

/**
   * Class representing the Dotdigital Sms API.
   * Extends the base Dotdigital API class.
*/
class DDSmsApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client);
  }

  /**
   * Enrols a contact into a program.
   * @param {string} mobileNumber - The number to send the sms to.
   * @param {string} message - The sms message.
   * @returns A promise that resolves to json.
   */
  public async sendSms(
    mobileNumber: string,
    message: string
  ) {

    try{
      const formattedNumber = checkAndCleanMobileNumber(mobileNumber);
      const response: ModifiedResponse = await this.post(
        `/v2/sms-messages/send-to/${formattedNumber}`,
        {
          message: message
        }
      );
      return response;
    } catch (error) {
      throw error as APIError ?? 'Failed to fetch contact';
    }
  }
}

export default DDSmsApi;
