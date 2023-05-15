/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { ContentTemplateTypes, RequestFn } from '../utils/types'
import { MessagingLogger } from '../utils/messaging-logger'
import { MessageUtils } from '../utils/message-utils'

const Liquid = new LiquidJs()

type PushContent = ContentTemplateTypes & { title?: string }

export class PushSender {
  private readonly messagingLogger: MessagingLogger
  private readonly messageUtils: MessageUtils
  private readonly supportedTemplateTypes = ['twilio/text', 'twilio/media']

  constructor(
    readonly request: RequestFn,
    readonly payload: Payload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'],
    readonly logger: Logger | undefined
  ) {
    this.messagingLogger = new MessagingLogger(logger)
    this.messageUtils = new MessageUtils(this.messagingLogger, settings, statsClient, tags, request)
  }

  async send() {
    const recipients = this.payload.externalIds?.filter(
      (extId) => extId.subscriptionStatus?.toLowerCase() === 'subscribed'
    )

    // when no devices are capable of receiving a push
    if (!recipients?.length) {
      this.statsClient?.incr('actions-personas-messaging-twilio.notsubscribed', 1, this.tags)
      return
    }

    const { requestBody, customData } = await this.getBody()
    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )

    /* we send a request for each individual subscribed device because the delivery
     * webhook callback does not include the push token/external id value
     * this is a limitation that will be handled post beta
     */
    for (const recipient of recipients) {
      const webhookUrl = this.messageUtils.getWebhookUrlWithParams(
        recipient.type,
        recipient.id,
        this.payload.customArgs
      )

      try {
        const body = new URLSearchParams(requestBody)

        if (recipient?.type?.toLowerCase() === 'ios.push_token') {
          body.append(
            'Recipients',
            JSON.stringify({
              apn: [{ addr: recipient.id }]
            })
          )
        } else {
          body.append(
            'Recipients',
            JSON.stringify({
              fcm: [{ addr: recipient.id }]
            })
          )
        }

        body.append(
          'CustomData',
          JSON.stringify({
            ...customData,
            __segment_internal_external_id_key__: recipient.type,
            __segment_internal_external_id_value__: recipient.id
          })
        )
        body.append('Recipients', JSON.stringify(recipient))
        if (webhookUrl) {
          body.append('DeliveryCallbackUrl', webhookUrl)
        }

        const response = await this.request(
          `https://push.ashburn.us1.twilio.com/v1/Services/${this.payload.from}/Notifications`,
          {
            method: 'POST',
            headers: {
              authorization: `Basic ${twilioToken}`
            },
            body
          }
        )

        this.tags.push(`twilio_status_code:${response.status}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.response', 1, this.tags)

        return response
      } catch (error: any) {
        this.logger?.error(`TE Messaging: Push failed to send - ${error.message}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
        // on unexpected fail, do not block rest of phones from receiving push notification
      }
    }

    if (this.payload.eventOccurredTS != undefined) {
      this.statsClient?.histogram(
        'actions-personas-messaging-twilio.eventDeliveryTS',
        Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
        this.tags
      )
    }
  }

  private async getBody(): Promise<{
    requestBody: URLSearchParams
    customData: object
  }> {
    const content = await this.messageUtils.getContentTemplateTypes(
      this.payload.contentSid,
      'PUSH',
      this.supportedTemplateTypes
    )

    const parsedTemplateContent = await this.parseTemplateContent({
      ...content,
      title: this.payload.customizations?.title
    })

    try {
      const customData: Record<string, unknown> = {
        ...this.payload.customArgs,
        space_id: this.settings.spaceId,
        badgeAmount: this.payload.customizations?.badgeAmount,
        badgeStrategy: this.payload.customizations?.badgeStrategy,
        media: parsedTemplateContent.media?.length ? parsedTemplateContent.media : undefined
      }

      const body = this.removeEmpties({
        Body: parsedTemplateContent.body,
        Action: this.payload.customizations?.tapAction,
        Title: parsedTemplateContent.title,
        Sound: this.payload.customizations?.sound,
        Priority: this.payload.customizations?.priority,
        TimeToLive: this.payload.customizations?.ttl,
        FcmPayload: {
          mutable_content: true,
          notification: {
            badge: this.payload.customizations?.badgeAmount
          }
        },
        ApnPayload: {
          aps: {
            'mutable-content': 1,
            badge: this.payload.customizations?.badgeAmount
          }
        }
      })

      const requestBody = new URLSearchParams({
        ...body,
        FcmPayload: JSON.stringify(body.FcmPayload),
        ApnPayload: JSON.stringify(body.ApnPayload)
      })

      return { requestBody, customData: this.removeEmpties(customData) }
    } catch (error) {
      console.log(error)
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.logger?.error(`TE Messaging: Push failed to construct request body - [${error}]`)
      throw new IntegrationError('Unable to construct request body', 'Twilio Request Body Failure', 400)
    }
  }

  private async parseTemplateContent(content: PushContent): Promise<PushContent> {
    const profile = { profile: { traits: this.payload.traits } }
    try {
      return {
        title: await Liquid.parseAndRender(content.title || '', profile),
        body: await Liquid.parseAndRender(content.body, profile),
        media: await Promise.all(content.media?.map((media) => Liquid.parseAndRender(media, profile)) || [])
      }
    } catch (error: unknown) {
      this.logger?.error(`TE Messaging: Push templating parse failure - ${this.settings.spaceId} - [${error}]`)
      throw new IntegrationError(`Unable to parse templating in Push`, `Push templating parse failure`, 400)
    }
  }

  // removes null, undefined, and keys with [] as the value
  private removeEmpties(obj: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(
      JSON.stringify(obj, (_, value) => {
        return value === null || value?.length === 0 ? undefined : value
      })
    )
  }
}
