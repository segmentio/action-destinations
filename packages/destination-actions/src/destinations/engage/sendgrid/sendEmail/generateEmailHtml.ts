import { IntegrationError } from '@segment/actions-core'
import { UnlayerResponse } from './UnlayerResponse'
import { SendEmailPerformer } from './SendEmailPerformer'

export async function generateEmailHtml(this: SendEmailPerformer, design: string): Promise<string> {
  try {
    this.statsClient.incr('actions-personas-messaging-sendgrid.unlayer_request', 1)
    const response = await this.request('https://api.unlayer.com/v2/export/html', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${this.settings.unlayerApiKey}:`).toString('base64')}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayMode: 'email',
        design: JSON.parse(design)
      })
    })

    const body = await response.json()
    return (body as UnlayerResponse).data.html
  } catch (error) {
    this.logger.error(`export request failure - ${this.settings.spaceId} - [${error}]`)
    this.tags.push('reason:generate_email_html')
    this.statsClient.incr('actions-personas-messaging-sendgrid.error', 1)
    throw new IntegrationError('Unable to export email as HTML', 'Export HTML failure', 400)
  }
}
