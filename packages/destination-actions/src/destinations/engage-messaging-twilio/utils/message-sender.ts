import { Liquid as LiquidJs } from 'liquidjs'
import type { Settings } from '../generated-types'
import type { Payload as SmsPayload } from '../sendSms/generated-types'
import type { Payload as WhatsappPayload } from '../sendWhatsApp/generated-types'
import { IntegrationError, PayloadValidationError, RequestOptions } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { ExecuteInput } from '@segment/actions-core'
import { ContentTemplateResponse, ContentTemplateTypes, Profile, TwilioApiError } from './types'

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
    readonly request: RequestFn,
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

  async send() {
    this.beforeSend()
    //this.stats('incr', 'initialize', 1)
    return this.logWrap(this.doSend.bind(this), {
      operationName: 'Destination Action',
      stats: {
        onStart: () => [{ metric: 'destination_action_start' }],
        onEnd: (r) => [
          { metric: 'destination_action_end', extraTags: r.error ? ['error:true', 'reason:' + r.error] : undefined }
        ]
      }
    })
  }

  /*
   * takes an object full of content containing liquid traits, renders it, and returns it in the same shape
   */
  async parseContent<R extends Record<string, string | string[] | undefined>>(
    content: R,
    profile: Profile
  ): Promise<R> {
    try {
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
    } catch (error: unknown) {
      this.logDetails['error'] = error instanceof Error ? error.message : (error as object)?.toString()
      this.logError(`unable to parse templating - ${this.settings.spaceId}`)
      this.tags.push('reason:invalid_liquid')
      this.stats('incr', 'error', 1)
      throw new PayloadValidationError(`Unable to parse templating in ${this.getChannelType()}`)
    }
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

  logWrap<R = void>(
    fn: () => R,
    args: {
      operationName: string
      stats?: {
        onStart?: () => StatsArgs[] | undefined
        onEnd?: (args: { result?: Awaited<R>; error?: unknown; duration: number }) => StatsArgs[] | undefined
      }
    }
  ): R {
    const start = Date.now()
    return wrapPromisable(fn, {
      onStart: () => {
        this.logInfo('Starting: ', args.operationName)
        const statsStart = args.stats?.onStart?.()
        if (statsStart)
          for (const statsArgs of statsStart) {
            this.stats(statsArgs)
          }
      },
      onFinally: (fin) => {
        const duration = Date.now() - start
        if ('result' in fin) {
          this.logInfo('Success: ', args.operationName, `Duration: ${duration} ms`)
        } else {
          this.logError(fin.error, 'Failed: ', args.operationName, `Duration: ${duration} ms`)
        }
        const statsEnd = args.stats?.onEnd?.({ ...fin, duration })
        if (statsEnd)
          for (const statsArgs of statsEnd) {
            this.stats(statsArgs)
          }
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

  async getContentTemplateTypes(): Promise<ContentTemplateTypes> {
    let template
    try {
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

      template = (await response.json()) as ContentTemplateResponse
    } catch (error) {
      this.tags.push('reason:get_content_template')
      this.stats('incr', 'error', 1)
      this.logError(
        `failed request to fetch content template from Twilio Content API - ${
          this.settings.spaceId
        } - ${error}, ${JSON.stringify(error)})}`
      )
      throw new IntegrationError('Unable to fetch content template', 'Twilio Content API request failure', 500)
    }

    return this.extractTemplateTypes(template)
  }

  private extractTemplateTypes(template: ContentTemplateResponse): ContentTemplateTypes {
    if (!template.types) {
      this.logError(
        `template from Twilio Content API does not contain a template type - ${
          this.settings.spaceId
        } - [${JSON.stringify(template)}]`
      )
      this.tags.push('reason:invalid_template_type')
      this.stats('incr', 'error', 1)
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
      this.logError(`unsupported content template type '${type}' - ${this.settings.spaceId}`)
      this.tags.push('reason:invalid_template_type')
      this.stats('incr', 'error', 1)
      throw new IntegrationError(
        `Sending templates with '${type}' content type is not supported by ${this.getChannelType()}`,
        'UNSUPPORTED_CONTENT_TYPE',
        400
      )
    }
  }

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

      try {
        const webhookUrlWithParams = new URL(webhookUrl)

        for (const key of Object.keys(customArgs)) {
          webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
        }

        webhookUrlWithParams.hash = connectionOverrides || defaultConnectionOverrides
        return webhookUrlWithParams.toString()
      } catch (error: unknown) {
        this.logDetails['webhook-custom-args'] = this.payload.customArgs
        this.logError(`invalid webhook url - ${this.settings.spaceId}`)
        throw new PayloadValidationError('Invalid webhook url arguments')
      }
    }

    return null
  }

  getRethrowableError(error: unknown, apiName = 'Twilio Programmable API'): unknown {
    let errorToRethrow = error
    if (error instanceof Object) {
      const twilioApiError = error as TwilioApiError
      this.logDetails['twilioApiError_response_data'] = twilioApiError.response?.data
      this.logDetails['twilio-request-id'] = twilioApiError.response?.headers?.get('twilio-request-id')
      this.logDetails['error'] = twilioApiError.response

      this.logError(`${apiName} error - ${this.settings.spaceId}`)
      const statusCode = twilioApiError.status || twilioApiError.response?.data?.status
      this.tags.push(`twilio_status_code:${statusCode}`)
      this.stats('incr', 'response', 1)

      if (!twilioApiError.status) {
        //to handle error properly by Centrifuge
        errorToRethrow = new IntegrationError(
          twilioApiError.response?.data?.message || twilioApiError.message,
          (twilioApiError.response?.data?.code || statusCode)?.toString() || 'Twilio Api Request Error',
          statusCode
        )
      }

      const errorCode = twilioApiError.response?.data?.code
      if (errorCode === 63018 || statusCode === 429) {
        // Exceeded WhatsApp rate limit
        this.stats('incr', 'rate_limited', 1)
      }
    }
    return errorToRethrow
  }

  rethrowError(error: unknown, apiName = 'Twilio Programmable API') {
    throw this.getRethrowableError(error, apiName)
  }
}

export function wrapPromisable<T>(
  fn: () => T,
  args: {
    onStart?(): void
    onSuccess?(res: Awaited<T>): void
    onCatch?(error: unknown): Awaited<T>
    onFinally?(res: { result: Awaited<T> } | { error: unknown }): void
  }
): T {
  args.onStart?.()
  let finallyRes: { result: Awaited<T> } | { error: unknown } | undefined = undefined

  try {
    const res = fn()
    if (isPromise<Awaited<T>>(res))
      return (async () => {
        try {
          const unpromiseRes = await res
          finallyRes = { result: unpromiseRes }
          args.onSuccess?.(unpromiseRes)
          return unpromiseRes
        } catch (error) {
          finallyRes = { error }
          if (!args.onCatch) throw error
          return args.onCatch(error)
        } finally {
          args.onFinally?.(finallyRes!)
        }
      })() as any as T // eslint-disable-line @typescript-eslint/no-explicit-any -- to make the type checker happy

    finallyRes = { result: res as Awaited<T> }
    args.onSuccess?.(res as Awaited<T>)
    return res
  } catch (error) {
    finallyRes = { error }
    if (!args.onCatch) throw error
    return args.onCatch(error)
  } finally {
    if (finallyRes)
      // don't run it if it's a promise
      args.onFinally?.(finallyRes)
  }
}

// Copied from Typescript libs v4.5. Once we upgrade to v4.5, we can remove this
type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T // non-object or non-thenable

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
  // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
  //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise

  // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return obj instanceof Object && 'then' in obj && typeof obj.then === 'function'
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
