/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IntegrationError } from '@segment/actions-core'
import { MessageSender } from '../utils/message-sender'
import type { Payload as PushPayload } from './generated-types'

interface BodyCustomDataBundle {
  requestBody: URLSearchParams
  customData: object
}

// TODO: get concrete error shapes
// we currently do not know the exact error response for this endpoint
// below is inferred from insomnia tests
interface PushApiError {
  response: {
    code: number
    status: number
    message: string
    data?: {
      code: number
      status: number
      message: string
    }
  }
}

export class PushSender<Payload extends PushPayload> extends MessageSender<Payload> {
  static externalIdTypes = ['ios.push_token', 'android.push_token']
  protected supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']
  private retryableStatusCodes = [500, 401, 429]
  private DEFAULT_HOSTNAME = 'push.ashburn.us1.twilio.com'

  getChannelType(): string {
    return 'push'
  }

  async send() {
    this.initLogDetails()

    return this.logWrap([`Destination Action ${this.getChannelType().toUpperCase()}`], async () => {
      if (!this.payload.send) {
        this.logInfo(`Not sending message, payload.send = ${this.payload.send} - ${this.settings.spaceId}`)
        this.statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, this.tags)
        return
      }
      // we send notifications to every eligible device (subscribed and of a push type)
      const recipientDevices = this.payload.externalIds?.filter(
        (extId) =>
          extId.subscriptionStatus?.toLowerCase() === 'subscribed' &&
          extId.type &&
          PushSender.externalIdTypes.includes(extId.type)
      )

      if (!recipientDevices?.length) {
        this.logInfo(`Not sending message, no devices are subscribed - ${this.settings.spaceId}`)
        return
      }

      const { requestBody, customData } = await this.getBody()
      const twilioHostname = this.settings.twilioHostname?.length || this.DEFAULT_HOSTNAME
      const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
        'base64'
      )

      /*
       * we send a request for each individual subscribed device because the delivery
       * webhook callback does not include the push token/external id value
       * this is a limitation that will be handled post beta
       */
      const responses = []
      const failedSends = []
      let failureIsRetryable = true
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
          console.error(`https://${twilioHostname}/v1/Services/${this.payload.from}/Notifications`)
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
          responses.push(response)
        } catch (error: unknown) {
          /* on unexpected fail, do not block rest of phones from receiving push notification
           * we dont want to retry the entire send again either if some succeeded and some failed,
           * if we do, we run the risk of spamming devices that succeeded with centrifuge retries
           * it's accepted that the user received the notification since all devices in externalIds belong to them
           */
          console.error(error)
          if (error instanceof Object) {
            const apiError = error as PushApiError
            responses.push(apiError.response)

            // we set a flag to retry only if a non-retryable status has not been encountered already
            const errorStatus = apiError.response?.status ?? apiError.response?.data?.status

            failureIsRetryable = failureIsRetryable && this.retryableStatusCodes.includes(errorStatus)
          } else {
            // unknown error - do not retry
            failureIsRetryable = false
          }

          failedSends.push({ ...recipientDevice, id: this.redactPii(recipientDevice.id) })
          this.logDetails['failed-recipient-devices'] = failedSends
          this.logTwilioError(error)
        }
      }

      /*
       * if every device failed to send, lets attempt to retry if possible
       */
      if (failedSends.length === recipientDevices.length) {
        this.logError(`all devices failed send - ${this.settings.spaceId}`)
        if (failureIsRetryable) {
          throw new IntegrationError('Unexpected response from Twilio Push API', 'UNEXPECTED_ERROR', 500)
        }
        throw new IntegrationError('Unexpected response from Twilio Push API', 'BAD_REQUEST', 400)
      }

      if (this.payload.eventOccurredTS != undefined) {
        this.statsClient?.histogram(
          'actions-personas-messaging-twilio.eventDeliveryTS',
          Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
          this.tags
        )
      }

      return responses
    })
  }

  async getBody(): Promise<BodyCustomDataBundle> {
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
        FcmPayload: this.removeEmpties({
          mutable_content: true,
          notification: {
            badge: this.payload.customizations?.badgeAmount
          }
        }),
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
      this.logError(`unable to construct request body - ${this.settings.spaceId}`, JSON.stringify(error))
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
        if (value == null || value?.length === 0 || (typeof value === 'object' && Object.keys(value).length === 0)) {
          return undefined
        }
        return value
      })
    )
  }
}
