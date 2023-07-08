/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MessageSender } from './message-sender'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { TrackedError } from '../operationTracking'

enum SendabilityStatus {
  NoSenderPhone = 'no_sender_phone',
  ShouldSend = 'should_send',
  NotSubscribed = 'not_subscribed',
  SendDisabled = 'send_disabled',
  InvalidSubscriptionStatus = 'invalid_subscription_status'
}

type SendabilityPayload = { sendabilityStatus: SendabilityStatus; phone: string | undefined }

export abstract class PhoneMessage<Payload extends SmsPayload | WhatsappPayload> extends MessageSender<Payload> {
  private readonly EXTERNAL_ID_KEY = 'phone'
  private readonly DEFAULT_HOSTNAME = 'api.twilio.com'
  private readonly DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'

  abstract getBody(phone: string): Promise<URLSearchParams>

  async doSend() {
    const { phone, sendabilityStatus } = this.getSendabilityPayload()

    if (sendabilityStatus !== SendabilityStatus.ShouldSend || !phone) {
      this.currentOperation?.tags.push('not_sent_reason:' + sendabilityStatus)
      this.currentOperation?.logs.push(
        `Not sending message, because sendabilityStatus: ${sendabilityStatus}, phone: ${this.redactPii(phone)}`
      )
      return
    }
    this.currentOperation?.onFinally.push((op) => {
      const error = op.error as TrackedError
      if (error) op.tags.push('not_sent_reason:error_operation_' + error.trackedContext?.operation)
    })

    const body = await this.getBody(phone)

    const webhookUrlWithParams = this.getWebhookUrlWithParams(
      this.EXTERNAL_ID_KEY,
      phone,
      this.DEFAULT_CONNECTION_OVERRIDES
    )

    if (webhookUrlWithParams) body.append('StatusCallback', webhookUrlWithParams)

    const twilioHostname = this.settings.twilioHostname ?? this.DEFAULT_HOSTNAME
    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )

    this.statsSet('message_body_size', body?.toString().length)

    this.logInfo('Sending message to Twilio API')

    const response = await this.request(
      `https://${twilioHostname}/2010-04-01/Accounts/${this.settings.twilioAccountSID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${twilioToken}`
        },
        body
      }
    )
    this.tags.push(`twilio_status_code:${response.status}`)
    this.statsIncr('response', 1)

    if (this.payload.eventOccurredTS != undefined) {
      this.statsHistogram('eventDeliveryTS', Date.now() - new Date(this.payload.eventOccurredTS).getTime())
    }

    this.logDetails['twilio-request-id'] = response.headers?.get('twilio-request-id')

    this.logInfo('Message sent successfully')

    return response
  }

  /**
   * check if the externalId object is supported for sending a message
   * @param externalId
   * @returns
   */
  isValidExternalId(externalId: NonNullable<Payload['externalIds']>[number]): boolean {
    return externalId.type === 'phone' && this.getChannelType() === externalId.channelType?.toLowerCase()
  }

  private getSendabilityPayload(): SendabilityPayload {
    if (!this.payload.send) {
      return { sendabilityStatus: SendabilityStatus.SendDisabled, phone: undefined }
    }

    // list of extenalIds that are supported by this Channel
    const validExtIds = this.payload.externalIds?.filter((extId) => this.isValidExternalId(extId))

    // finding first that isSubscribed
    const firstSubscribedExtId = validExtIds?.find(
      (extId) =>
        extId.subscriptionStatus &&
        MessageSender.sendableStatuses.includes(extId.subscriptionStatus?.toString()?.toLowerCase())
    )

    const invalidStatuses = validExtIds?.filter((extId) => {
      const subStatus = extId.subscriptionStatus?.toString()?.toLowerCase()
      if (!subStatus) return false // falsy status is valid and considered to be Not Subscribed, so return false
      // if subStatus is not in any of the lists of valid statuses, then return true
      return !(
        MessageSender.nonSendableStatuses.includes(subStatus) || MessageSender.sendableStatuses.includes(subStatus)
      )
    })

    const hasInvalidStatuses = invalidStatuses && invalidStatuses.length > 0
    if (hasInvalidStatuses) {
      this.logInfo(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        `Invalid subscription statuses found in externalIds: ${invalidStatuses!
          .map((extId) => extId.subscriptionStatus)
          .join(', ')}`
      )
    }

    let status: SendabilityStatus = SendabilityStatus.NotSubscribed

    const phone = this.payload.toNumber || firstSubscribedExtId?.id

    if (firstSubscribedExtId) {
      status = phone ? SendabilityStatus.ShouldSend : SendabilityStatus.NoSenderPhone
    } else if (hasInvalidStatuses) {
      status = SendabilityStatus.InvalidSubscriptionStatus
    } else if (validExtIds && validExtIds.length > 0) {
      status = SendabilityStatus.NotSubscribed
    } else {
      status = SendabilityStatus.NoSenderPhone
    }

    return { sendabilityStatus: status, phone }
  }
}
