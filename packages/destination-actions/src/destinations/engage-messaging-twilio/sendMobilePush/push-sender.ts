/* eslint-disable @typescript-eslint/no-unsafe-call */
import { HTTPError, IntegrationError, RetryableError } from '@segment/actions-core'
import { MessageSender, track } from '../utils'
import type { Payload as PushPayload } from './generated-types'
import { ContentTemplateTypes } from '../utils/types'
import { PayloadValidationError } from '@segment/actions-core'
import { SendabilityStatus } from '../utils'

interface BodyCustomDataBundle {
  requestBody: URLSearchParams
  customData: object
}

// TODO: get concrete error shapes once the push api service is finalized
// we currently do not know the exact error response for this endpoint
// below is inferred from insomnia tests
class PushApiError extends HTTPError {
  response: Response & {
    data?: {
      code: number
      status: number
      message: string
    }
  }
}

export class PushSender<Payload extends PushPayload> extends MessageSender<Payload> {
  static readonly externalIdTypes = ['ios.push_token', 'android.push_token']
  protected supportedTemplateTypes: string[] = ['twilio/text', 'twilio/media']
  private retryableStatusCodes = [500, 429]
  private DEFAULT_HOSTNAME = 'push.ashburn.us1.twilio.com'

  getChannelType(): string {
    return 'mobilepush'
  }

  async doSend() {
    if (!this.payload.send) {
      this.logInfo(`not sending push notification, payload.send = ${this.payload.send} - ${this.settings.spaceId}`)
      this.currentOperation?.tags.push('sendability_status:' + SendabilityStatus.SendDisabled)
      return
    }
    // we send notifications to every eligible device (subscribed and of a push type)
    const allPushDevices =
      this.payload.externalIds?.filter((extId) => extId.type && PushSender.externalIdTypes.includes(extId.type)) || []
    const recipientDevices =
      allPushDevices?.filter(
        (extId) =>
          extId.subscriptionStatus && MessageSender.sendableStatuses.includes(extId.subscriptionStatus?.toLowerCase())
      ) || []

    if (recipientDevices.length) {
      this.statsIncr('subscribed', 1)
    }

    const totalUnsubscribed = allPushDevices.length - recipientDevices.length
    if (totalUnsubscribed > 0) {
      this.statsIncr('notsubscribed', totalUnsubscribed)
    }

    if (!recipientDevices?.length) {
      this.logInfo(`not sending push notification, no devices are subscribed - ${this.settings.spaceId}`)
      this.currentOperation?.tags.push('sendability_status:' + SendabilityStatus.NotSubscribed)
      return
    }
    this.currentOperation?.tags.push('sendability_status:' + SendabilityStatus.ShouldSend)

    const { requestBody, customData } = await this.getBody()
    const twilioHostname = this.settings.twilioHostname?.length ? this.settings.twilioHostname : this.DEFAULT_HOSTNAME
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

        this.statsSet('message_body_size', body?.toString().length)

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

        responses.push(response)
      } catch (error: unknown) {
        /* on unexpected fail, do not block rest of phones from receiving push notification
         * we dont want to retry the entire send again either if some succeeded and some failed,
         * if we do, we run the risk of spamming devices that succeeded with centrifuge retries
         * it's accepted that the user received the notification since all devices in externalIds belong to them
         */
        let errorResponse = undefined
        if (error instanceof Object) {
          const apiError = error as PushApiError
          errorResponse = apiError.response
          responses.push(errorResponse)

          // we set a flag to retry only if a non-retryable status has not been encountered already
          const errorStatus = apiError.response?.status ?? apiError.response?.data?.status

          failureIsRetryable = failureIsRetryable && this.retryableStatusCodes.includes(errorStatus)
        } else {
          // unknown error - do not retry
          failureIsRetryable = false
        }

        failedSends.push({ ...recipientDevice, id: this.redactPii(recipientDevice.id), error, response: errorResponse })
      }
    }

    /*
     * if every device failed to send, lets attempt to retry if possible
     */
    if (failedSends.length === recipientDevices.length) {
      //This statement wont be reached if recipientDevices.length = 0
      if (failureIsRetryable) {
        throw new RetryableError(
          'Failed to send to all subscribed devices. First error: ' + JSON.stringify(failedSends[0])
        )
      }

      throw new IntegrationError(
        'Failed to send to all subscribed devices. First error: ' + JSON.stringify(failedSends[0]),
        'UNEXPECTED_ERROR',
        responses.find((resp) => !this.retryableStatusCodes.includes(resp.status))?.status || 400
      )
    }

    this.currentOperation?.tags.push(`total_succeeded:${recipientDevices.length - failedSends.length}`)
    this.currentOperation?.tags.push(`total_failed:${failedSends.length}`)
    if (this.payload.eventOccurredTS != undefined) {
      this.statsHistogram('eventDeliveryTS', Date.now() - new Date(this.payload.eventOccurredTS).getTime())
    }

    return responses
  }

  @track({
    wrapIntegrationError: () => new PayloadValidationError('Unable to construct Notify API request body')
  })
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

    const customData: Record<string, unknown> = this.removeEmpties({
      ...this.payload.customArgs,
      space_id: this.settings.spaceId,
      badgeAmount,
      badgeStrategy,
      media: parsedTemplateContent.media?.length ? parsedTemplateContent.media : undefined,
      deepLink: this.payload.customizations?.deepLink,
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
