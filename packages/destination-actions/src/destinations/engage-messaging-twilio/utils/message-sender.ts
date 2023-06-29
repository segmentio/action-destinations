import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError, PayloadValidationError, RequestOptions } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { ExecuteInput } from '@segment/actions-core'
import { ContentTemplateResponse, ContentTemplateTypes, Profile } from './types'
import { TrackableArgs, trackable } from './trackable'
import { wrapPromisable } from './wrapPromisable'

const Liquid = new LiquidJs()

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>
type StatsMethod = keyof Pick<StatsClient, 'incr' | 'histogram' | 'set'>

export const FLAGON_NAME_LOG_INFO = 'engage-messaging-log-info'
export const FLAGON_NAME_LOG_ERROR = 'engage-messaging-log-error'

export abstract class MessageSender<MessagePayload extends SmsPayload | WhatsappPayload> {
  static readonly nonSendableStatuses = ['unsubscribed', 'did not subscribed', 'false'] // do we need that??
  static readonly sendableStatuses = ['subscribed', 'true']
  protected readonly supportedTemplateTypes: string[]

  readonly payload: MessagePayload
  readonly settings: Settings
  readonly statsClient: StatsClient | undefined
  readonly tags: StatsContext['tags']
  readonly logger: Logger | undefined

  constructor(
    readonly request: RequestFn, //TODO: implement request method with trackable capabilities
    readonly executeInput: ExecuteInput<Settings, MessagePayload>,
    readonly logDetails: Record<string, unknown> = {}
  ) {
    this.payload = executeInput.payload
    this.settings = executeInput.settings
    this.statsClient = executeInput.statsContext?.statsClient
    this.tags = executeInput.statsContext?.tags ?? []
    if (!this.settings.region) {
      this.settings.region = 'us-west-1'
    }
    this.tags.push(
      `space_id:${this.settings.spaceId}`,
      `projectid:${this.settings.sourceId}`,
      `region:${this.settings.region}`,
      `channel:${this.getChannelType()}`
    )
    this.logger = executeInput.logger
  }

  abstract getChannelType(): string
  abstract doSend(): Promise<Response | Response[] | object[] | undefined>

  @trackable({ log: true, stats: true })
  async send() {
    this.beforeSend()
    return this.doSend()
  }

  /*
   * takes an object full of content containing liquid traits, renders it, and returns it in the same shape
   */
  @trackable({
    log: true,
    stats: true,
    onError: () => ({
      error: new PayloadValidationError('Unable to parse templating'),
      tags: ['reason:invalid_liquid']
    })
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

  logInfo(...msgs: string[]) {
    if (!this.isFeatureActive(FLAGON_NAME_LOG_INFO, () => false)) return
    const [firstMsg, ...rest] = msgs
    this.logger?.info(
      `TE Messaging: ${this.getChannelType().toUpperCase()} ${firstMsg}`,
      ...rest,
      JSON.stringify(this.logDetails)
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(error?: any, ...msgs: string[]) {
    if (!this.isFeatureActive(FLAGON_NAME_LOG_ERROR, () => false)) return
    const [firstMsg, ...rest] = msgs
    if (typeof error === 'string') {
      this.logger?.error(
        `TE Messaging: ${this.getChannelType().toUpperCase()} ${error}`,
        ...msgs,
        JSON.stringify(this.logDetails)
      )
    } else {
      this.logger?.error(
        `TE Messaging: ${this.getChannelType().toUpperCase()} ${firstMsg}`,
        ...rest,
        error instanceof Error ? error.message : error?.toString(),
        JSON.stringify(this.logDetails)
      )
    }
  }

  stats<TStatsMethod extends StatsMethod>(args: StatsArgs<TStatsMethod>): void
  stats<TStatsMethod extends StatsMethod>(
    statsMethod: TStatsMethod,
    metric: string,
    value: number,
    extraTags?: string[]
  ): void
  stats(...args: unknown[]): void {
    if (!this.statsClient) return
    const statsArgs = args[0] as StatsArgs
    const [statsMethod, metric, value, extraTags] =
      statsArgs instanceof Object
        ? [statsArgs.method, statsArgs.metric, statsArgs.value, statsArgs.extraTags]
        : (args as [statsMethod: StatsMethod, metric: string, value?: number, extraTags?: string[]])
    let statsFunc = this.statsClient?.[statsMethod || 'incr'].bind(this.statsClient)
    if (!statsFunc)
      switch (
        statsMethod ||
        'incr' // have to do this to avoid issues with JS bundler/minifier
      ) {
        case 'incr':
          statsFunc = this.statsClient?.incr.bind(this.statsClient)
          break
          break
        case 'histogram':
          statsFunc = this.statsClient?.histogram.bind(this.statsClient)
          break
          break
        case 'set':
          statsFunc = this.statsClient?.set.bind(this.statsClient)
          break
          break
        default:
          break
      }

    statsFunc?.(`actions_personas_messaging_twilio.${metric}`, typeof value === 'undefined' ? 1 : value, [
      ...this.tags,
      ...(extraTags ?? [])
    ])
  }

  statsIncrement(metric: string, value?: number, extraTags?: string[]) {
    this.stats({ method: 'incr', metric, value, extraTags })
  }

  statsHistogram(metric: string, value: number, extraTags?: string[]) {
    this.stats({ method: 'histogram', metric, value, extraTags })
  }

  statsSet(metric: string, value: number, extraTags?: string[]) {
    this.stats({ method: 'set', metric, value, extraTags })
  }

  trackWrap<R = void>(fn: () => R, operation: string, _args?: TrackableArgs, _funcArgs?: unknown[]): R {
    type ErrorWithTrackableContext = Error & {
      trackableContext?: {
        operation: string
        tags?: string[]
        originalError?: unknown
      }
    }

    const start = Date.now()
    return wrapPromisable(fn, {
      onTry: () => {
        this.logInfo(`${operation} Starting...`)
        this.stats({ method: 'incr', metric: operation + '.try' })
      },
      onPrepareError: (err) => {
        const originalError = err
        let trackableError = err as ErrorWithTrackableContext
        let trackableContext = trackableError.trackableContext
        if (trackableContext) return trackableError //if already has trackable context then return the error as is

        trackableContext = { operation, originalError }
        if (_args?.onError) {
          const errRes = _args.onError.apply(this, [err])
          trackableContext.tags = errRes.tags
          trackableError = trackableError || err
        }
        trackableError.trackableContext = trackableContext
        return trackableError
      },
      onFinally: (fin) => {
        const duration = Date.now() - start
        const tags = []
        if ('result' in fin) {
          this.logInfo(`${operation} Success. Duration: ${duration} ms`)
          this.stats({ method: 'incr', metric: operation + '.success' })
          tags.push('success')
        } else {
          const error = fin.error as ErrorWithTrackableContext
          const { trackableContext } = error
          this.logError(error, `${operation} Failed. Duration: ${duration} ms`)
          const isErrorHappenedHere = trackableContext?.operation == operation //indicates if the error happened during this operation (not underlying trackable operation)
          if (isErrorHappenedHere && trackableContext.originalError && trackableContext.originalError != error) {
            this.logError(trackableContext.originalError, `${operation} Underlying error`)
          }

          const errorCode = error instanceof IntegrationError ? error.code : error?.constructor?.name || 'unknown'
          tags.push(`error_operation: ${trackableContext?.operation || operation}`, `error:${errorCode}`)
          if (trackableContext?.tags) tags.push(...trackableContext.tags)
          this.stats({ method: 'incr', metric: operation + '.error', extraTags: tags })
        }
        this.stats({ method: 'incr', metric: operation + '.finally', extraTags: tags })
        this.stats({ method: 'histogram', metric: operation + '.duration', value: duration, extraTags: tags })
      }
    })
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
  }

  @trackable({
    onError: (e) => ({
      error:
        e instanceof IntegrationError
          ? e
          : new IntegrationError('Unable to fetch content template', 'Twilio Content API request failure', 500)
      //tags: ['reason:get_content_template']
    })
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

  @trackable({
    onError: () => ({
      tags: ['reason:invalid_template_type']
    })
  })
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

  @trackable({ onError: () => ({ error: new PayloadValidationError('Invalid webhook url arguments') }) })
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

    if ('userId' in this.payload) {
      customArgs.user_id = this.payload.userId || ''
    }

    if (webhookUrl && customArgs) {
      // Webhook URL parsing has a potential of failing. I think it's better that
      // we fail out of any invocation than silently not getting analytics
      // data if that's what we're expecting.
      // let webhookUrlWithParams: URL | null = null

      trackableLogOnError(() => [JSON.stringify(customArgs)])
      const webhookUrlWithParams = new URL(webhookUrl)

      for (const key of Object.keys(customArgs)) {
        webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
      }

      webhookUrlWithParams.hash = connectionOverrides || defaultConnectionOverrides
      return webhookUrlWithParams.toString()
    }

    return null
  }
}

type StatsArgs<TStatsMethod extends StatsMethod = StatsMethod> = {
  method?: TStatsMethod
  metric: string
  value?: number
  extraTags?: string[]
}

export function isDestinationActionService() {
  // https://github.com/segmentio/integrations/blob/544b9d42b17f453bb6fcb48925997f68480ca1da/.k2/destination-actions-service.yaml#L35-L38
  return (
    process.env.DESTINATIONS_ACTION_SERVICE === 'true' || process.env.SERVICE_NAME === 'destination-actions-service'
  )
}
