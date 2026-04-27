import { RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { checkAndCleanEmail, cleanEmails } from '../../helpers/functions'

/**
 * Class representing the Dotdigital Email API.
 * Extends the base Dotdigital API class.
 */
class DDEmailApi extends DDApi {
  constructor(api_host: string, client: RequestClient) {
    super(api_host, client)
  }

  /**
   * Sends a transactional email.
   * @param {object} payload - The event payload.
   * @returns A promise that resolves to json.
   */
  public async sendTransactionalEmail(payload: { toAddresses: string; ccAddresses?: string; bccAddresses?: string; subject: string; fromAddress: string; htmlContent: string; plainTextContent?: string }) {
    const toAddresses = cleanEmails(payload.toAddresses)
    const ccAddresses = cleanEmails(payload.ccAddresses)
    const bccAddresses = cleanEmails(payload.bccAddresses)
    const fromAddress = checkAndCleanEmail(payload.fromAddress)
    return await this.post('/v2/email', {
      ToAddresses: toAddresses,
      CCAddresses: ccAddresses,
      BCCAddresses: bccAddresses,
      Subject: payload.subject,
      FromAddress: fromAddress,
      HtmlContent: payload.htmlContent,
      PlainTextContent: payload.plainTextContent
    })
  }
}

export default DDEmailApi
