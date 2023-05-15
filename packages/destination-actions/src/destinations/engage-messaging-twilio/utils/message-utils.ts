/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IntegrationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { MessagingLogger } from './messaging-logger'
import { ContentTemplateResponse, ContentTemplateTypes, RequestFn } from './types'
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'

export class MessageUtils {
  constructor(
    private readonly messagingLogger: MessagingLogger,
    private readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'],
    private readonly request: RequestFn
  ) {}

  async getContentTemplateTypes(
    contentSid: string,
    channelType: string,
    templateTypes: string[]
  ): Promise<ContentTemplateTypes> {
    let template
    try {
      this.messagingLogger.logInfo('Get content template from Twilio by ContentSID')

      const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
        'base64'
      )
      const response = await this.request(`https://content.twilio.com/v1/Content/${contentSid}`, {
        method: 'GET',
        headers: {
          authorization: `Basic ${twilioToken}`
        }
      })

      template = (await response.json()) as ContentTemplateResponse
    } catch (error) {
      this.tags.push('reason:get_content_template')
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.messagingLogger.logError(
        `${channelType} failed request to fetch content template from Twilio Content API - ${
          this.settings.spaceId
        } - ${error}, ${JSON.stringify(error)})}`
      )
      throw new IntegrationError('Unable to fetch content template', 'Twilio Content API request failure', 500)
    }

    return this.extractTemplateTypes(template, templateTypes, channelType)
  }

  private extractTemplateTypes(
    template: ContentTemplateResponse,
    templateTypes: string[],
    channelType: string
  ): ContentTemplateTypes {
    if (!template.types) {
      this.messagingLogger.logError(
        `${channelType} template from Twilio Content API does not contain a template type - ${
          this.settings.spaceId
        } - [${JSON.stringify(template)}]`
      )
      throw new IntegrationError(
        'Unexpected response from Twilio Content API',
        `${channelType} template does not contain a template type`,
        500
      )
    }
    const type = Object.keys(template.types)[0] // eg 'twilio/text', 'twilio/media', etc
    if (templateTypes.includes(type)) {
      return { body: template.types[type].body, media: template.types[type].media }
    } else {
      this.messagingLogger.logError(
        `${channelType} unsupported content template type '${type}' - ${this.settings.spaceId}`
      )
      throw new IntegrationError(
        'Unsupported content type',
        `Sending templates with '${type}' content type is not supported by ${channelType}`,
        400
      )
    }
  }

  getWebhookUrlWithParams(
    externalIdType?: string,
    externalIdValue?: string,
    payloadCustomArgs?: Record<string, unknown>,
    defaultConnectionOverrides = 'rp=all&rc=5'
  ): string | null {
    const webhookUrl = this.settings.webhookUrl
    const connectionOverrides = this.settings.connectionOverrides
    const customArgs: Record<string, string | undefined> = {
      ...payloadCustomArgs,
      space_id: this.settings.spaceId,
      __segment_internal_external_id_key__: externalIdType,
      __segment_internal_external_id_value__: externalIdValue
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      const webhookUrlWithParams = new URL(webhookUrl)
      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || defaultConnectionOverrides

      return webhookUrlWithParams.toString()
    }

    return null
  }
}
