/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
// import type { Payload as SmsPayload } from '../sendSms/generated-types'
// import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { ContentTemplateResponse, ContentTemplateTypes, Profile } from './types'
import { track, MessageSendPerformer, MessagePayloadBase } from '../../utils'

const Liquid = new LiquidJs()

export interface TwilioPayloadBase extends MessagePayloadBase {
  contentSid?: string
}

export abstract class TwilioMessageSender<TPayload extends TwilioPayloadBase> extends MessageSendPerformer<
  Settings,
  TPayload
> {
  getIntegrationStatsName(): string {
    return 'actions_personas_messaging_twilio'
  }

  getDefaultSettingsRegion() {
    return 'us-west-1'
  }

  abstract readonly supportedTemplateTypes: string[]

  /*
   * takes an object full of content containing liquid traits, renders it, and returns it in the same shape
   */
  @track({
    wrapIntegrationError: () => new PayloadValidationError('Unable to parse templating, invalid liquid')
  })
  async parseContent<R extends Record<string, string | string[] | undefined>>(
    content: R,
    profile: Profile
  ): Promise<R> {
    const parsedEntries = await Promise.all(
      Object.entries(content).map(async ([key, val]) => {
        if (val == null) {
          return [key, val]
        }

        if (Array.isArray(val)) {
          val = await Promise.all(val.map((item) => Liquid.parseAndRender(item, { profile })))
        } else {
          val = await Liquid.parseAndRender(val, { profile })
        }
        return [key, val]
      })
    )

    return Object.fromEntries(parsedEntries)
  }

  @track({
    wrapIntegrationError: () => ['Unable to fetch content template', 'Twilio Content API request failure', 500]
  })
  async getContentTemplateTypes(): Promise<ContentTemplateTypes> {
    if (!this.payload.contentSid) {
      throw new PayloadValidationError('Content SID not in payload')
    }

    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )
    const response = await this.request(`https://content.twilio.com/v1/Content/${this.payload.contentSid}`, {
      method: 'GET',
      headers: {
        authorization: `Basic ${twilioToken}`
      }
    })

    const template = (await response.json()) as ContentTemplateResponse

    return this.extractTemplateTypes(template)
  }

  @track()
  private extractTemplateTypes(template: ContentTemplateResponse): ContentTemplateTypes {
    if (!template.types) {
      throw new IntegrationError(
        'Template from Twilio Content API does not contain any template types',
        `NO_CONTENT_TYPES`,
        400
      )
    }

    const type = Object.keys(template.types)[0] // eg 'twilio/text', 'twilio/media', etc
    if (this.supportedTemplateTypes.includes(type)) {
      return { body: template.types[type].body, media: template.types[type].media }
    } else {
      throw new IntegrationError(
        `Sending templates with '${type}' content type is not supported by ${this.getChannelType()}`,
        'UNSUPPORTED_CONTENT_TYPE',
        400
      )
    }
  }

  @track({
    wrapIntegrationError: () => new PayloadValidationError('Invalid webhook url arguments')
  })
  getWebhookUrlWithParams(
    externalIdType?: string,
    externalIdValue?: string,
    defaultConnectionOverrides = 'rp=all&rc=5'
  ): string | null {
    const webhookUrl = this.settings.webhookUrl
    const connectionOverrides = this.settings.connectionOverrides
    const customArgs: Record<string, string | undefined> = {
      ...this.payload.customArgs,
      space_id: this.settings.spaceId,
      __segment_internal_external_id_key__: externalIdType,
      __segment_internal_external_id_value__: externalIdValue
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      // let webhookUrlWithParams: URL | null = null

      this.logOnError(() => JSON.stringify(customArgs))
      const webhookUrlWithParams = new URL(webhookUrl)

      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || defaultConnectionOverrides
      return webhookUrlWithParams.toString()
    }

    return null
  }

  beforePerform() {
    super.beforePerform()
    Object.assign(this.logDetails, {
      contentSid: this.payload.contentSid,
      twilioApiKeySID: this.settings.twilioApiKeySID
    })
  }
}
