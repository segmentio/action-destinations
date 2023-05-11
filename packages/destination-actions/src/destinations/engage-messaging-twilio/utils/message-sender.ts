/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { ExecuteInput } from '@segment/actions-core'

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly executeInput: ExecuteInput<Settings, MessagePayload>,
    readonly logDetails: Record<string, unknown> = {}
  )
  {
  }

  abstract getBody(phone: string): Promise<URLSearchParams>

  abstract getChannelType():string

  /**
   * check if the externalId object is supported for sending a message
   * @param externalId 
   * @returns 
   */
  isValidExternalId(externalId: NonNullable<MessagePayload['externalIds']>[number]): boolean {
    return externalId.type === 'phone' && this.getChannelType() === externalId.channelType?.toLowerCase()
  }

  redactPii(pii: string|undefined){
    if(!pii) return pii
    if(pii.length<=8) return "***"
    return pii.substring(0, 3)+'***'+pii.substring(pii.length-3)
  }

  logInfo(...msgs:string[])
  {
    const [firstMsg, ...rest] = msgs
    this.logger?.info("TE Messaging: "+firstMsg, ...rest, JSON.stringify(this.logDetails))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(error?: any, ...msgs:string[])
  {
    const [firstMsg, ...rest] = msgs
    if(typeof error === 'string' )
    {
      this.logger?.error(`TE Messaging: ${error}`, ...msgs, JSON.stringify(this.logDetails))
    }
    else 
    {
      this.logger?.error("TE Messaging: "+firstMsg, ...rest, error instanceof Error? error.message: error?.toString(), JSON.stringify(this.logDetails))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static isPromise<T=unknown>(obj: unknown): obj is Promise<T> {
    // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
    //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise
    
    // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return obj instanceof Object && 'then' in obj && typeof obj.then === 'function'
  }

  logWrap<R=void>(messages:string[], fn: ()=>R):R{
    this.logInfo("Starting: ", ...messages)
    try{
      const res = fn()
      if(MessageSender.isPromise(res)){
        return (async()=>{
          try{
            const promisedRes = await res
            this.logInfo("Success: ", ...messages)
            return promisedRes
          } catch(error:unknown){
            this.logError(error, "Failed: ", ...messages)
            throw error
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })() as any as R // cast to R otherwise ts is not happy
      }
      this.logInfo("Success: ", ...messages)
      return res
    }
    catch(error:unknown){
      this.logError(error, "Failed: ", ...messages)
      throw error
    }
  }

  /**
   * populate the logDetails object with the data that should be logged for every message
   */
  initLogDetails()//overrideable
  {
    Object.assign(this.logDetails,{
      externalIds: this.payload.externalIds?.map(eid=>({...eid, id: this.redactPii(eid.id)})),
      shouldSend: this.payload.send,
      contentSid: this.payload.contentSid,
      sourceId: this.settings.sourceId,
      spaceId : this.settings.spaceId,
      twilioApiKeySID : this.settings.twilioApiKeySID,
      region : this.settings.region,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageId: (this.executeInput as any)['rawData']?.messageId, // undocumented, not recommended way used here for tracing retries in logs https://github.com/segmentio/action-destinations/blob/main/packages/core/src/destination-kit/action.ts#L141
      channelType: this.getChannelType(),
    })
    if('userId' in this.payload)
      this.logDetails.userId = this.payload.userId
  }

  async send(){

    this.initLogDetails()

    return this.logWrap([`Destination Action ${this.getChannelType()}`], async ()=>{
      const { phone, sendabilityStatus } = this.getSendabilityPayload()

      if (sendabilityStatus !== SendabilityStatus.ShouldSend || !phone) {
        this.logInfo(`Not sending message, because sendabilityStatus: ${sendabilityStatus}, phone: ${this.redactPii(phone)}`)
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

      this.statsClient?.set(
        'actions_personas_messaging_twilio.message_body_size',
        body?.toString().length,
        this.tags
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
        this.statsClient?.incr('actions_personas_messaging_twilio.response', 1, this.tags)

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
          const statusCode = twilioApiError.status || twilioApiError.response?.data?.status
          this.tags.push(`twilio_status_code:${statusCode}`)
          this.statsClient?.incr('actions_personas_messaging_twilio.response', 1, this.tags)
  
          if(!twilioApiError.status) //to handle error properly by Centrifuge
          {
            errorToRethrow = new IntegrationError(
              twilioApiError.message,
              twilioApiError.response?.data?.message,
              statusCode
            )
          }

          const errorCode = twilioApiError.response?.data?.code
          if (errorCode === 63018 || statusCode === 429) {
            // Exceeded WhatsApp rate limit
            this.statsClient?.incr('actions_personas_messaging_twilio.rate_limited', 1, this.tags)
          }
        }
        // Bubble the error to integrations
        throw errorToRethrow
      }
    })
  }

  static nonSendableStatuses = ['unsubscribed', 'did not subscribed', 'false'] // do we need that??
  static sendableStatuses = ['subscribed', 'true']
  private getSendabilityPayload(): SendabilityPayload {

    if (!this.payload.send) {
      this.statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, this.tags)
      return { sendabilityStatus: SendabilityStatus.SendDisabled, phone: undefined }
    }

    // list of extenalIds that are supported by this Channel
    const validExtIds = this.payload.externalIds?.filter(extId => this.isValidExternalId(extId))
    
    // finding first that isSubscribed
    const firstSubscribedExtId = validExtIds?.find(extId => extId.subscriptionStatus
      && MessageSender.sendableStatuses.includes(extId.subscriptionStatus?.toString()?.toLowerCase())
    )

    const invalidStatuses = validExtIds?.filter(extId=>{
      const subStatus = extId.subscriptionStatus?.toString()?.toLowerCase()
      if(!subStatus) return false // falsy status is valid and considered to be Not Subscribed, so return false
      // if subStatus is not in any of the lists of valid statuses, then return true
      return !(MessageSender.nonSendableStatuses.includes(subStatus) || MessageSender.sendableStatuses.includes(subStatus))
    })
    
    const hasInvalidStatuses = invalidStatuses && invalidStatuses.length > 0
    if(hasInvalidStatuses){
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.logInfo(`Invalid subscription statuses found in externalIds: ${invalidStatuses!.map(extId=>extId.subscriptionStatus).join(', ')}`)
    }

    let status: SendabilityStatus = SendabilityStatus.DoNotSend

    const phone = this.payload.toNumber || firstSubscribedExtId?.id

    if (firstSubscribedExtId) {
      this.statsClient?.incr('actions_personas_messaging_twilio.subscribed', 1, this.tags)
      status = phone ? SendabilityStatus.ShouldSend : SendabilityStatus.NoSenderPhone
    } else if(hasInvalidStatuses) {
      this.statsClient?.incr('actions_personas_messaging_twilio.invalid_subscription_status', 1, this.tags)
      status = SendabilityStatus.InvalidSubscriptionStatus
    } else if (validExtIds && validExtIds.length > 0) {
      this.statsClient?.incr('actions_personas_messaging_twilio.notsubscribed', 1, this.tags)
      status = SendabilityStatus.DoNotSend
    } else{
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
