/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../sendSms/generated-types'
import { IntegrationError } from '@segment/actions-core'
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'

enum SendabilityStatus {
  NoSenderPhone = 'no_sender_phone',
  ShouldSend = 'should_send',
  DoNotSend = 'do_not_send',
  SendDisabled = 'send_disabled',
  InvalidSubscriptionStatus = 'invalid_subscription_status'
}

type SendabilityPayload = { sendabilityStatus: SendabilityStatus; phone: string | undefined }

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

type MinimalPayload = Pick<
  Payload,
  'from' | 'toNumber' | 'customArgs' | 'externalIds' | 'traits' | 'send' | 'eventOccurredTS'
>

export abstract class MessageSender<SmsPayload extends MinimalPayload> {
  private readonly EXTERNAL_ID_KEY = 'phone'
  private readonly DEFAULT_HOSTNAME = 'api.twilio.com'
  private readonly DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'

  constructor(
    readonly request: RequestFn,
    readonly payload: SmsPayload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'] | undefined
  ) {}

  abstract getBody: (phone: string) => Promise<URLSearchParams>

  abstract getExternalId: () => NonNullable<MinimalPayload['externalIds']>[number] | undefined

  send = async () => {
    const { phone, sendabilityStatus } = this.getSendabilityPayload()

    if (sendabilityStatus !== SendabilityStatus.ShouldSend || !phone) {
      return
    }

    const body = await this.getBody(phone)

    const webhookUrlWithParams = this.getWebhookUrlWithParams(phone)

    if (webhookUrlWithParams) body.append('StatusCallback', webhookUrlWithParams)

    const twilioHostname = this.settings.twilioHostname ?? this.DEFAULT_HOSTNAME
    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )
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
    this.tags?.push(`twilio_status_code:${response.status}`)
    this.statsClient?.incr('actions-personas-messaging-twilio.response', 1, this.tags)

    if (this.payload.eventOccurredTS != undefined) {
      this.statsClient?.histogram(
        'actions-personas-messaging-twilio.eventDeliveryTS',
        Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
        this.tags
      )
    }
    return response
  }

  private getSendabilityPayload = (): SendabilityPayload => {
    const nonSendableStatuses = ['unsubscribed', 'did not subscribed', 'false']
    const sendableStatuses = ['subscribed', 'true']
    const externalId = this.getExternalId()

    let status: SendabilityStatus

    if (!this.payload.send) {
      this.statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, this.tags)
      return { sendabilityStatus: SendabilityStatus.SendDisabled, phone: undefined }
    }

    if (!externalId?.subscriptionStatus || nonSendableStatuses.includes(externalId.subscriptionStatus)) {
      this.statsClient?.incr('actions-personas-messaging-twilio.notsubscribed', 1, this.tags)
      status = SendabilityStatus.DoNotSend
    } else if (sendableStatuses.includes(externalId.subscriptionStatus)) {
      this.statsClient?.incr('actions-personas-messaging-twilio.subscribed', 1, this.tags)
      status = SendabilityStatus.ShouldSend
    } else {
      this.statsClient?.incr('actions-personas-messaging-twilio.twilio-error', 1, this.tags)
      throw new IntegrationError(
        `Failed to recognize the subscriptionStatus in the payload: "${externalId.subscriptionStatus}".`,
        'Invalid subscriptionStatus value',
        400
      )
    }

    const phone = this.payload.toNumber || externalId?.id
    if (!phone) {
      status = SendabilityStatus.NoSenderPhone
    }

    return { sendabilityStatus: status, phone }
  }

  private getWebhookUrlWithParams = (phone: string): string | null => {
    const webhookUrl = this.settings.webhookUrl
    const connectionOverrides = this.settings.connectionOverrides
    const customArgs: Record<string, string | undefined> = {
      ...this.payload.customArgs,
      space_id: this.settings.spaceId,
      __segment_internal_external_id_key__: this.EXTERNAL_ID_KEY,
      __segment_internal_external_id_value__: phone
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      const webhookUrlWithParams = new URL(webhookUrl)
      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || this.DEFAULT_CONNECTION_OVERRIDES

      return webhookUrlWithParams.toString()
    }

    return null
  }
}
