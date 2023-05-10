/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'

enum SendabilityStatus {
  NoSenderPhone = 'no_sender_phone',
  ShouldSend = 'should_send',
  DoNotSend = 'do_not_send',
  SendDisabled = 'send_disabled',
  InvalidSubscriptionStatus = 'invalid_subscription_status'
}

interface TwilioApiError extends Error {
  response: {
    data: {
      code: number
      message: string
      more_info: string
      status: number
    },
    headers?: Response['headers'],
  },
  code?: number
  status?: number
  statusCode?: number
}

type SendabilityPayload = { sendabilityStatus: SendabilityStatus; phone: string | undefined }

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

export abstract class MessageSender<MessagePayload extends SmsPayload | WhatsappPayload> {
  private readonly EXTERNAL_ID_KEY = 'phone'
  private readonly DEFAULT_HOSTNAME = 'api.twilio.com'
  private readonly DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'

  constructor(
    readonly request: RequestFn,
    readonly payload: MessagePayload,
    readonly settings: Settings,
    readonly statsClient: StatsClient | undefined,
    readonly tags: StatsContext['tags'],
    readonly logger: Logger | undefined,

    readonly logDetails: Record<string, unknown> = {}
  )
  {
  }

  abstract getBody(phone: string): Promise<URLSearchParams>

  abstract getChannelType():'sms' | 'whatsapp'

  getExternalId(){ 
    // searching for the first externalId that matches the phone type and current channel type
    return this.payload.externalIds?.find(({ type, channelType }) => type === 'phone' && channelType?.toLowerCase() === this.getChannelType()
    )
  }

  redactId(piiId: string|undefined){
    if(!piiId) return piiId
    return piiId.substring(0, 4)+'***'+piiId.substring(piiId.length-4)
  }

  logInfo(...msgs:string[])
  {
    this.logger?.info("TE Messaging: " + msgs.join(' '), JSON.stringify(this.logDetails))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(error?: any, ...msgs:string[])
  {
    this.logger?.error("TE Messaging: "+msgs.join(' '), error instanceof Error? error.message: error?.toString(), JSON.stringify(this.logDetails))
  }

  logWrap<R=void>(args:{messages:string[], fn: ()=>R}):R{
    this.logInfo("Starting: ", ...args.messages)
    try{
      const res = args.fn()
      this.logInfo("Success: ", ...args.messages)
      return res
    }
    catch(error:unknown){
      this.logError(error, "Error: ", ...args.messages)
      throw error
    }
  }

  async send(){

    Object.assign(this.logDetails,{
      externalIds: this.payload.externalIds?.map(eid=>({...eid, id: this.redactId(eid.id)})),
      shouldSend: this.payload.send,
      contentSid: this.payload.contentSid,
      sourceId: this.settings.sourceId,
      spaceId : this.settings.spaceId,
      twilioApiKeySID : this.settings.twilioApiKeySID,
      region : this.settings.region,
    })
    if( 'userId' in this.payload)
      this.logDetails['userId'] = this.payload.userId
    if( 'messageId' in this.payload)
      this.logDetails['messageId'] = this.payload.messageId

    return this.logWrap({
      messages: [`Destination Action ${this.getChannelType()}`],
      fn:async ()=>{
        const { phone, sendabilityStatus } = this.getSendabilityPayload()

        if (sendabilityStatus !== SendabilityStatus.ShouldSend || !phone) {
          return
        }

        this.logInfo("Getting content Body")
        const body = await this.getBody(phone)

        const webhookUrlWithParams = this.getWebhookUrlWithParams(phone)

        if (webhookUrlWithParams) body.append('StatusCallback', webhookUrlWithParams)

        const twilioHostname = this.settings.twilioHostname ?? this.DEFAULT_HOSTNAME
        const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
          'base64'
        )
        try {
          this.logInfo("Sending message to Twilio API")

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
          this.statsClient?.incr('actions-personas-messaging-twilio.response', 1, this.tags)

          if (this.payload.eventOccurredTS != undefined) {
            this.statsClient?.histogram(
              'actions-personas-messaging-twilio.eventDeliveryTS',
              Date.now() - new Date(this.payload.eventOccurredTS).getTime(),
              this.tags
            )
          }

          this.logDetails['twilio-request-id'] = response.headers?.get('twilio-request-id')

          this.logInfo("Message sent successfully")

          return response
        } catch (errorOrig: unknown) {
          let errorToRethrow = errorOrig
          if (errorOrig instanceof Object) {
            const twilioApiError = errorOrig as TwilioApiError
            this.logDetails['twilioApiError_response_data'] = twilioApiError.response?.data
            this.logDetails['twilio-request-id'] = twilioApiError.response?.headers?.get('twilio-request-id')
            this.logDetails['error'] = twilioApiError.response

            this.logError(
              `Twilio Programmable API error - ${this.settings.spaceId}`
            )

            if(!twilioApiError.status) //to handle error properly by Centrifuge
            {
              errorToRethrow = new IntegrationError(twilioApiError.message, twilioApiError.response.data.message, twilioApiError.response.data.status)
            }

            const errorCode = twilioApiError.response?.data?.code
            if (errorCode === 63018) {
              // Exceeded WhatsApp rate limit
              this.statsClient?.incr('actions-personas-messaging-twilio.rate-limited', 1, this.tags)
            }
          }
          // Bubble the error to integrations
          throw errorToRethrow
        }
    }})

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
