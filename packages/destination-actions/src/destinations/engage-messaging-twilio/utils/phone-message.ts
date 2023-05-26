/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MessageSender } from './message-sender'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'

enum SendabilityStatus {
  NoSenderPhone = 'no_sender_phone',
  ShouldSend = 'should_send',
  DoNotSend = 'do_not_send',
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
      this.logInfo(
        `Not sending message, because sendabilityStatus: ${sendabilityStatus}, phone: ${this.redactPii(phone)}`
      )
      return
    }

    this.logInfo('Getting content Body')
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

    this.statsClient?.set('actions_personas_messaging_twilio.message_body_size', body?.toString().length, this.tags)

    try {
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
      this.statsClient?.incr('actions_personas_messaging_twilio.response', 1, this.tags)

      if (this.payload.eventOccurredTS != undefined) {
        this.statsClient?.histogram(
          'actions-personas-messaging-twilio.eventDeliveryTS',
          Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
          this.tags
        )
      }

      this.logDetails['twilio-request-id'] = response.headers?.get('twilio-request-id')

      this.logInfo('Message sent successfully')

      return response
    } catch (error: unknown) {
      this.throwTwilioError(error)
    }
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
      this.statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, this.tags)
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.logInfo(
        `Invalid subscription statuses found in externalIds: ${invalidStatuses!
          .map((extId) => extId.subscriptionStatus)
          .join(', ')}`
      )
    }

    let status: SendabilityStatus = SendabilityStatus.DoNotSend

    const phone = this.payload.toNumber || firstSubscribedExtId?.id

    if (firstSubscribedExtId) {
      this.statsClient?.incr('actions_personas_messaging_twilio.subscribed', 1, this.tags)
      status = phone ? SendabilityStatus.ShouldSend : SendabilityStatus.NoSenderPhone
    } else if (hasInvalidStatuses) {
      this.statsClient?.incr('actions_personas_messaging_twilio.invalid_subscription_status', 1, this.tags)
      status = SendabilityStatus.InvalidSubscriptionStatus
    } else if (validExtIds && validExtIds.length > 0) {
      this.statsClient?.incr('actions_personas_messaging_twilio.notsubscribed', 1, this.tags)
      status = SendabilityStatus.DoNotSend
    } else {
      status = SendabilityStatus.NoSenderPhone
    }

    return { sendabilityStatus: status, phone }
  }
}
