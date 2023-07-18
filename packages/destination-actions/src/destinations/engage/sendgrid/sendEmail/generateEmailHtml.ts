import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'
import { UnlayerResponse } from './UnlayerResponse'

export const generateEmailHtml = async (
  request: RequestClient,
  settings: Settings,
  design: string,
  statsClient: StatsClient | undefined,
  tags: string[],
  logger?: Logger | undefined
): Promise<string> => {
  try {
    statsClient?.incr('actions-personas-messaging-sendgrid.unlayer_request', 1, tags)
    const response = await request('https://api.unlayer.com/v2/export/html', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.unlayerApiKey}:`).toString('base64')}`,
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
    logger?.error(`TE Messaging: Email export request failure - ${settings.spaceId} - [${error}]`)
    tags.push('reason:generate_email_html')
    statsClient?.incr('actions-personas-messaging-sendgrid.error', 1, tags)
    throw new IntegrationError('Unable to export email as HTML', 'Export HTML failure', 400)
  }
}
