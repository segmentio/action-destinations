/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IntegrationError } from '@segment/actions-core'
import { MessageSender } from '../utils/message-sender'
import type { Payload as PushPayload } from './generated-types'

interface BodyCustomDataBundle {
  requestBody: URLSearchParams
  customData: object
}

export class PushSender<Payload extends PushPayload> extends MessageSender<Payload> {
  private externalIdTypes = ['ios.push_token', 'android.push_token']
  protected supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']
  private retryableStatusCodes = [500, 401, 429]
  private DEFAULT_HOSTNAME = 'push.ashburn.us1.twilio.com'

  getChannelType(): string {
    return 'push'
  }

  async send() {
    this.initLogDetails()

    return this.logWrap([`Destination Action ${this.getChannelType()}`], async () => {
      if (!this.payload.send) {
        this.logInfo(`Not sending message, payload.send = ${this.payload.send}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, this.tags)
        return
      }
      // we send notifications to every eligible device (subscribed and of a push type)
      const recipientDevices = this.payload.externalIds?.filter(
        (extId) =>
          extId.subscriptionStatus?.toLowerCase() === 'subscribed' &&
          extId.type &&
          this.externalIdTypes.includes(extId.type)
      )

      if (!recipientDevices?.length) {
        this.logInfo(`Not sending message, no devices are subscribed`)
        return
      }

      const { requestBody, customData } = await this.getBody()
      const twilioHostname = this.settings.twilioHostname ?? this.DEFAULT_HOSTNAME
      const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
        'base64'
      )

      /*
       * we send a request for each individual subscribed device because the delivery
       * webhook callback does not include the push token/external id value
       * this is a limitation that will be handled post beta
       */
      const failedSends = []
      let failureIsRetryable = false
      let lastError
      for (const recipientDevice of recipientDevices) {
        const webhookUrl = this.getWebhookUrlWithParams(recipientDevice.type, recipientDevice.id)

        try {
          const body = new URLSearchParams(requestBody)

          if (recipientDevice?.type?.toLowerCase() === 'ios.push_token') {
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

          this.statsClient?.set(
            'actions_personas_messaging_twilio.message_body_size',
            body?.toString().length,
            this.tags
          )

          const response = await this.request(
            `https://${twilioHostname}/v1/Services/${this.payload.from}/Notifications`,
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
        } catch (error: unknown) {
          /* on unexpected fail, do not block rest of phones from receiving push notification
           * we dont want to retry the entire send again either - if some succeeded and some failed,
           * if we do, we run the risk of spamming devices that succeeded with centrifuge retries
           */
          failedSends.push({ ...recipientDevice, id: this.redactPii(recipientDevice.id) })
          this.logDetails['failed-recipient-devices'] = failedSends
          lastError = this.logTwilioError(error) as Error
          failureIsRetryable =
            typeof lastError === 'object' &&
            'statusCode' in lastError &&
            this.retryableStatusCodes.includes(lastError.statusCode as number)
        }
      }

      /*
       * if every device failed to send, lets attempt to retry if possible
       * to effectively retry, we need multi-status responses (currently not available for this destination)
       * this is a "best-effort"
       */
      if (failureIsRetryable && failedSends.length === recipientDevices.length) {
        this.logError(`${this.getChannelType()} all devices failed send - ${this.settings.spaceId}`)
        throw lastError
      }

      if (this.payload.eventOccurredTS != undefined) {
        this.statsClient?.histogram(
          'actions-personas-messaging-twilio.eventDeliveryTS',
          Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
          this.tags
        )
      }
    })
  }

  async getBody(_contactVector?: string): Promise<BodyCustomDataBundle> {
    const templateTypes = await this.getContentTemplateTypes()
    const profile = { traits: this.payload.traits }

    const parsedTemplateContent = await this.parseContent(
      {
        ...templateTypes,
        title: this.payload.customizations?.title
      },
      profile
    )

    try {
      const customData: Record<string, unknown> = this.removeEmpties({
        ...this.payload.customArgs,
        space_id: this.settings.spaceId,
        badgeAmount: this.payload.customizations?.badgeAmount,
        badgeStrategy: this.payload.customizations?.badgeStrategy,
        media: parsedTemplateContent.media?.length ? parsedTemplateContent.media : undefined,
        deepLink: this.payload.customizations?.deepLink
      })

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

      return { requestBody, customData }
    } catch (error) {
      this.statsClient?.incr('actions-personas-messaging-twilio.error', 1, this.tags)
      this.logError(
        `${this.getChannelType()} unable to construct request body - ${this.settings.spaceId}`,
        JSON.stringify(error)
      )
      throw new IntegrationError('Unable to construct request body', 'Twilio Request Body Failure', 400)
    }
  }

  /*
   * removes keys with null, undefined, empty strings, and keys with [] as the value
   * this is to minimize the FCM/APN payload to fit into 4KB
   */
  private removeEmpties(obj: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(
      JSON.stringify(obj, (_, value) => {
        return value === null || value?.length === 0 ? undefined : value
      })
    )
  }
}
