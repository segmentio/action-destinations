/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { TwilioMessageSender } from '../utils'
import { ExtId, track } from '../../utils'
import type { Payload as PushPayload } from './generated-types'
import { ContentTemplateTypes } from '../utils/types'
import { PayloadValidationError } from '@segment/actions-core'

interface BodyCustomDataBundle {
  requestBody: URLSearchParams
  customData: object
}

type Recepient = ExtId<PushPayload>

export enum MobilePushExtIdTypes {
  IOS = 'ios.push_token',
  ANDROID = 'android.push_token'
}

export class PushSender extends TwilioMessageSender<PushPayload> {
  static readonly externalIdTypes = Object.values(MobilePushExtIdTypes)
  getChannelType(): string {
    return 'mobilepush'
  }
  isSupportedExternalId(externalId: ExtId<PushPayload>): boolean {
    return PushSender.externalIdTypes.includes(externalId.type as any)
  }

  readonly supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']
  private DEFAULT_HOSTNAME = 'push.ashburn.us1.twilio.com'

  get twilioHostname() {
    return this.settings.twilioHostname?.length ? this.settings.twilioHostname : this.DEFAULT_HOSTNAME
  }
  get twilioToken() {
    //TODO cache this (lazy load)
    return Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString('base64')
  }

  async beforeSend(recepients: Recepient[]) {
    if (this.payload.send && recepients.length > 0) {
      this.bodyCustomDataBundle = await this.getBody()
    }
  }

  bodyCustomDataBundle: BodyCustomDataBundle

  async sendToRecepient(recipientDevice: Recepient) {
    const { requestBody, customData } = this.bodyCustomDataBundle

    const webhookUrl = this.getWebhookUrlWithParams(recipientDevice.type, recipientDevice.id)

    const body = new URLSearchParams(requestBody)

    if (recipientDevice?.type?.toLowerCase() === MobilePushExtIdTypes.IOS) {
      body.append(
        'Recipients',
        JSON.stringify({
          apn: [{ addr: recipientDevice.id }]
        })
      )
    } else {
      body.append(
        'Recipients',
        JSON.stringify({
          fcm: [{ addr: recipientDevice.id }]
        })
      )
    }

    body.append(
      'CustomData',
      JSON.stringify({
        ...customData,
        __segment_internal_external_id_key__: recipientDevice.type,
        __segment_internal_external_id_value__: recipientDevice.id
      })
    )

    if (webhookUrl) {
      body.append('DeliveryCallbackUrl', webhookUrl)
    }

    this.statsSet('message_body_size', body?.toString().length)

    const res = await this.request(`https://${this.twilioHostname}/v1/Services/${this.payload.from}/Notifications`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${this.twilioToken}`
      },
      body
    })
    return res
  }

  @track()
  async getBody(): Promise<BodyCustomDataBundle> {
    let templateTypes: ContentTemplateTypes | undefined
    if (this.payload.contentSid) {
      templateTypes = await this.getContentTemplateTypes()
    }

    const profile = { traits: this.payload.traits }

    const parsedTemplateContent = await this.parseContent(
      {
        title: this.payload.customizations?.title,
        body: this.payload.customizations?.body,
        media: this.payload.customizations?.media,
        ...templateTypes
      },
      profile
    )

    const badgeAmount = this.payload.customizations?.badgeAmount ?? 1
    const badgeStrategy = this.payload.customizations?.badgeStrategy ?? 'inc'

    try {
      const customData: Record<string, unknown> = this.removeEmpties({
        ...this.payload.customArgs,
        space_id: this.settings.spaceId,
        badgeAmount,
        badgeStrategy,
        media: parsedTemplateContent.media?.length ? parsedTemplateContent.media : undefined,
        link: this.payload.customizations?.link,
        tapActionButtons: this.payload.customizations?.tapActionButtons
      })

      const body = this.removeEmpties({
        Body: parsedTemplateContent.body,
        Action: this.payload.customizations?.tapAction,
        Title: parsedTemplateContent.title,
        Sound: this.payload.customizations?.sound,
        Priority: this.payload.customizations?.priority,
        TimeToLive: this.payload.customizations?.ttl,
        FcmPayload: this.removeEmpties({
          mutable_content: true,
          notification: {
            badge: badgeAmount
          }
        }),
        ApnPayload: {
          aps: {
            'mutable-content': 1,
            badge: badgeAmount
          }
        }
      })

      const requestBody = new URLSearchParams({
        ...body,
        FcmPayload: JSON.stringify(body.FcmPayload),
        ApnPayload: JSON.stringify(body.ApnPayload)
      })

      return { requestBody, customData }
    } catch (error: unknown) {
      this.rethrowIntegrationError(
        error,
        () => new PayloadValidationError('Unable to construct Notify API request body')
      )
    }
  }

  /*
   * removes keys with null, undefined, empty strings, and keys with [] as the value
   * this is to minimize the FCM/APN payload to fit into 4KB
   */
  private removeEmpties(obj: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(
      JSON.stringify(obj, (_, value) => {
        if (value == null || value?.length === 0 || (typeof value === 'object' && Object.keys(value).length === 0)) {
          return undefined
        }
        return value
      })
    )
  }
}
