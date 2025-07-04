import { APIError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { checkAndCleanEmail, cleanEmails } from '../../helpers/functions'
import type { Payload } from '../../sendTransactionalEmail/generated-types'

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
    try {
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
    } catch (error) {
      throw (error as APIError) ?? 'Failed to send transactional email'
    }
  }
}

export default DDEmailApi
