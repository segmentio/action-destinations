/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError, PayloadValidationError, RequestClient, RequestOptions } from '@segment/actions-core'
import { ExecuteInput } from '@segment/actions-core'
import { ContentTemplateResponse, ContentTemplateTypes, Profile } from './types'
import { TwilioApiError } from '../../utils/TwilioApiError'
import { track, OperationContext } from '../../utils/track'
import { isDestinationActionService } from '../../utils/isDestinationActionService'
import { MessageLogger } from '../../utils/MessageLogger'
import { MessageStats } from '../../utils/MessageStats'
import { IntegrationErrorWrapper } from '../../utils/IntegrationErrorWrapper'

const Liquid = new LiquidJs()

export abstract class MessageSender<MessagePayload extends SmsPayload | WhatsappPayload> {
  readonly logger: MessageLogger = new MessageLogger(this)
  readonly statsClient: MessageStats = new MessageStats(this)

  readonly currentOperation: OperationContext | undefined

  static readonly nonSendableStatuses = ['unsubscribed', 'did not subscribed', 'false'] // do we need that??
  static readonly sendableStatuses = ['subscribed', 'true']
  protected readonly supportedTemplateTypes: string[]

  readonly payload: MessagePayload
  readonly settings: Settings

  constructor(readonly requestRaw: RequestClient, readonly executeInput: ExecuteInput<Settings, MessagePayload>) {
    this.payload = executeInput.payload
    this.settings = executeInput.settings
    if (!this.settings.region) {
      this.settings.region = 'us-west-1'
    }
  }

  @track()
  async request(url: string, options: RequestOptions): Promise<Response> {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      // log response from error or success
      const respError = op?.error as TwilioApiError
      const response = respError?.response || (op.result as Response)
      const response_code = response?.data?.code || respError?.code
      if (response_code) op.tags.push(`response_code:${response_code}`)

      const response_status = response?.data?.status || respError?.status
      if (response_status) op.tags.push(`response_status:${response_status}`)
    })
    return this.requestRaw(url, options)
  }

  abstract getChannelType(): string
  abstract doSend(): Promise<Response | Response[] | object[] | undefined>

  @track()
  async perform() {
    this.beforeSend()
    return this.doSend()
  }

  /*
   * takes an object full of content containing liquid traits, renders it, and returns it in the same shape
   */
  @track({
    wrapIntegrationError: () => new PayloadValidationError('Unable to parse templating, invalid liquid')
  })
  async parseContent<R extends Record<string, string | string[] | undefined>>(
    content: R,
    profile: Profile
  ): Promise<R> {
    const parsedEntries = await Promise.all(
      Object.entries(content).map(async ([key, val]) => {
        if (val == null) {
          return [key, val]
        }

        if (Array.isArray(val)) {
          val = await Promise.all(val.map((item) => Liquid.parseAndRender(item, { profile })))
        } else {
          val = await Liquid.parseAndRender(val, { profile })
        }
        return [key, val]
      })
    )

    return Object.fromEntries(parsedEntries)
  }

  redactPii(pii: string | undefined) {
    if (!pii) {
      return pii
    }

    if (pii.length <= 8) {
      return '***'
    }
    return pii.substring(0, 3) + '***' + pii.substring(pii.length - 3)
  }

  isFeatureActive(featureName: string, getDefault?: () => boolean) {
    if (isDestinationActionService()) return true
    if (!this.executeInput.features || !(featureName in this.executeInput.features)) return getDefault?.()
    return this.executeInput.features[featureName]
  }

  logInfo(msg: string, metadata?: object) {
    this.logger.logInfo(msg, metadata)
  }
  logError(msg: string, metadata?: object) {
    this.logger.logError(msg, metadata)
  }
  /**
   * Add a message to the log of current tracked operation, only if error happens during current operation. You can add some arguments here
   * @param getLogMessage
   */
  logOnError(logMessage: string | ((ctx: OperationContext) => string)) {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      if (op.error) {
        const msg = typeof logMessage === 'function' ? logMessage(op) : logMessage
        op.logs.push(msg)
      }
    })
  }

  statsIncr(metric: string, value?: number, tags?: string[]) {
    this.statsClient.stats({ method: 'incr', metric, value, tags })
  }

  statsHistogram(metric: string, value: number, tags?: string[]) {
    this.statsClient.stats({ method: 'histogram', metric, value, tags })
  }

  statsSet(metric: string, value: number, tags?: string[]) {
    this.statsClient.stats({ method: 'set', metric, value, tags })
  }

  get logDetails(): Record<string, unknown> {
    return this.logger.logDetails
  }

  get tags(): string[] {
    return this.statsClient.tags
  }

  /**
   * populate the logDetails object with the data that should be logged for every message
   */
  beforeSend() {
    //overrideable
    Object.assign(this.logDetails, {
      externalIds: this.payload.externalIds?.map((eid) => ({ ...eid, id: this.redactPii(eid.id) })),
      shouldSend: this.payload.send,
      contentSid: this.payload.contentSid,
      sourceId: this.settings.sourceId,
      spaceId: this.settings.spaceId,
      twilioApiKeySID: this.settings.twilioApiKeySID,
      region: this.settings.region,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageId: (this.executeInput as any)['rawData']?.messageId, // undocumented, not recommended way used here for tracing retries in logs https://github.com/segmentio/action-destinations/blob/main/packages/core/src/destination-kit/action.ts#L141
      channelType: this.getChannelType()
    })
    if ('userId' in this.payload) this.logDetails.userId = this.payload.userId
    if ('deliveryAttempt' in (this.executeInput as any)['rawData'])
      this.currentOperation?.tags.push(`delivery_attempt:${(this.executeInput as any)['rawData'].deliveryAttempt}`)
  }

  @track({
    wrapIntegrationError: () => ['Unable to fetch content template', 'Twilio Content API request failure', 500]
  })
  async getContentTemplateTypes(): Promise<ContentTemplateTypes> {
    if (!this.payload.contentSid) {
      throw new PayloadValidationError('Content SID not in payload')
    }

    const twilioToken = Buffer.from(`${this.settings.twilioApiKeySID}:${this.settings.twilioApiKeySecret}`).toString(
      'base64'
    )
    const response = await this.request(`https://content.twilio.com/v1/Content/${this.payload.contentSid}`, {
      method: 'GET',
      headers: {
        authorization: `Basic ${twilioToken}`
      }
    })

    const template = (await response.json()) as ContentTemplateResponse

    return this.extractTemplateTypes(template)
  }

  @track()
  private extractTemplateTypes(template: ContentTemplateResponse): ContentTemplateTypes {
    if (!template.types) {
      throw new IntegrationError(
        'Template from Twilio Content API does not contain any template types',
        `NO_CONTENT_TYPES`,
        400
      )
    }

    const type = Object.keys(template.types)[0] // eg 'twilio/text', 'twilio/media', etc
    if (this.supportedTemplateTypes.includes(type)) {
      return { body: template.types[type].body, media: template.types[type].media }
    } else {
      throw new IntegrationError(
        `Sending templates with '${type}' content type is not supported by ${this.getChannelType()}`,
        'UNSUPPORTED_CONTENT_TYPE',
        400
      )
    }
  }

  @track({
    wrapIntegrationError: () => new PayloadValidationError('Invalid webhook url arguments')
  })
  getWebhookUrlWithParams(
    externalIdType?: string,
    externalIdValue?: string,
    defaultConnectionOverrides = 'rp=all&rc=5'
  ): string | null {
    const webhookUrl = this.settings.webhookUrl
    const connectionOverrides = this.settings.connectionOverrides
    const customArgs: Record<string, string | undefined> = {
      ...this.payload.customArgs,
      space_id: this.settings.spaceId,
      __segment_internal_external_id_key__: externalIdType,
      __segment_internal_external_id_value__: externalIdValue
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      // let webhookUrlWithParams: URL | null = null

      this.logOnError(() => JSON.stringify(customArgs))
      const webhookUrlWithParams = new URL(webhookUrl)

      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || defaultConnectionOverrides
      return webhookUrlWithParams.toString()
    }

    return null
  }

  rethrowIntegrationError(
    error: unknown,
    getWrapper: () => IntegrationError | ConstructorParameters<typeof IntegrationError>
  ): never {
    throw IntegrationErrorWrapper.wrap(error, getWrapper, this.currentOperation)
  }
}
