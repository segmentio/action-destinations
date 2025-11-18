import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { checkAndCleanEmail, cleanEmails } from '../../helpers/functions'
import type { Payload } from '../../sendTransactionalEmail/generated-types'
import { DOTDIGITAL_API_VERSION } from '../../../versioning-info'

/**
 * Class representing the Dotdigital Email API.
 * Extends the base Dotdigital API class.
 */
class DDEmailApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
  }

  /**
   * Sends a transactional email.
   * @param {object} payload - The event payload.
   * @returns A promise that resolves to json.
   */
  public async sendTransactionalEmail(payload: Payload) {
    const toAddresses = cleanEmails(payload.toAddresses)
    const ccAddresses = cleanEmails(payload.ccAddresses)
    const bccAddresses = cleanEmails(payload.bccAddresses)
    const fromAddress = checkAndCleanEmail(payload.fromAddress)
    return await this.post(`/${DOTDIGITAL_API_VERSION}/email`, {
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
