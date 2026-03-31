import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { checkAndCleanMobileNumber } from '../../helpers/functions'

/**
 * Class representing the Dotdigital Sms API.
 * Extends the base Dotdigital API class.
 */
class DDSmsApi extends DDApi {
  constructor(api_host: string, client: RequestClient) {
    super(api_host, client)
  }

  /**
   * Enrols a contact into a program.
   * @param {string} mobileNumber - The number to send the sms to.
   * @param {string} message - The sms message.
   * @returns A promise that resolves to json.
   */
  public async sendSms(mobileNumber: string, message: string) {
    const formattedNumber = checkAndCleanMobileNumber(mobileNumber)
    const response: ModifiedResponse = await this.post(`/v2/sms-messages/send-to/${formattedNumber}`, {
      message: message
    })
    return response
  }
}

export default DDSmsApi
