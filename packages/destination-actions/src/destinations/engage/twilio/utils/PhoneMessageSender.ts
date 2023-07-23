/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { TwilioMessageSender, TwilioPayloadBase } from './TwilioMessageSender'
import { OperationDecorator, TrackedError, OperationContext, ExtId } from '../../utils'

/**
 * Base class for sending sms/mms
 */
export abstract class PhoneMessageSender<Payload extends PhoneMessagePayload> extends TwilioMessageSender<Payload> {
  private readonly EXTERNAL_ID_KEY = 'phone'
  private readonly DEFAULT_HOSTNAME = 'api.twilio.com'
  private readonly DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'

  abstract getBody(phone: string): Promise<URLSearchParams>

  get twilioHostname() {
    return this.settings.twilioHostname ?? this.DEFAULT_HOSTNAME
  }
  get twilioToken() {
    return Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString('base64')
  }

  async sendToRecepient(recepient: ExtId<Payload>) {
    const phone = recepient.id!
    const op = this.currentOperation as OperationContext
    this.currentOperation?.onFinally.push(() => {
      const error = op.error as TrackedError
      if (error)
        op.tags.push(
          'not_sent_reason:error_operation_' + OperationDecorator.getOperationName(error.trackedContext || op)
        )
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = await this.getBody(phone)

    const webhookUrlWithParams = this.getWebhookUrlWithParams(
      this.EXTERNAL_ID_KEY,
      phone,
      this.DEFAULT_CONNECTION_OVERRIDES
    )

    if (webhookUrlWithParams) body.append('StatusCallback', webhookUrlWithParams)

    this.statsSet('message_body_size', body?.toString().length)

    const response = await this.request(
      `https://${this.twilioHostname}/2010-04-01/Accounts/${this.settings.twilioAccountSID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${this.twilioToken}`
        },
        body
      }
    )

    this.logDetails['twilio-request-id'] = response.headers?.get('twilio-request-id')

    return response
  }

  isSupportedExternalId(externalId: NonNullable<Payload['externalIds']>[number]): boolean {
    return externalId.type === 'phone' && externalId.channelType?.toLowerCase() === this.getChannelType()
  }

  getRecepients(): ExtId<Payload>[] {
    if (this.payload.toNumber)
      return [
        {
          id: this.payload.toNumber
        }
      ]

    // for phone and email channels we only support single recepient and we take the first subscribed
    const res = super.getRecepients()
    return res.length > 0 ? [res[0]] : res
  }
}

export interface PhoneMessagePayload extends TwilioPayloadBase {
  /**
   * used as an override when testing
   */
  toNumber?: string
}
