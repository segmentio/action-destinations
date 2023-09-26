/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestClient } from '@segment/actions-core/create-request-client'
import { ExecuteInput } from '@segment/actions-core/destination-kit'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { EngageLogger } from './EngageLogger'
import { EngageStats } from './EngageStats'
import { OperationContext, track } from './track'
import { isDestinationActionService } from './isDestinationActionService'
import { ResponseError, getErrorDetails } from './ResponseError'
import { RequestOptions } from '@segment/actions-core/request-client'
import { IntegrationError } from '@segment/actions-core'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'
import { Awaited } from './operationTracking'
import truncate from 'lodash/truncate'

/**
 * Base class for all Engage Action Performers. Supplies common functionality like logger, stats, request, operation tracking
 */
export abstract class EngageActionPerformer<TSettings = any, TPayload = any, TReturn = any> {
  readonly logger: EngageLogger = new EngageLogger(this)
  readonly statsClient: EngageStats = new EngageStats(this)
  readonly currentOperation: OperationContext | undefined

  readonly payload: TPayload
  readonly settings: TSettings

  constructor(readonly requestClient: RequestClient, readonly executeInput: ExecuteInput<TSettings, TPayload>) {
    this.payload = executeInput.payload
    this.settings = executeInput.settings
  }

  beforePerform?(): void | Promise<void>

  @track()
  async perform() {
    await this.beforePerform?.()
    return this.doPerform()
  }

  abstract doPerform(): MaybePromise<TReturn>

  /**
   * gets the name of the integration used as a prefix for all stats metrics under this Action Performer
   */
  abstract getIntegrationStatsName(): string
  /**
   * used for stats tag of all metrics under this performer + for all log messages
   */
  abstract getChannelType(): string

  @track({
    onTry: addUrlToLog,
    onFinally: addUrlToLog
  })
  async request<Data = unknown>(url: string, options?: RequestOptions) {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      // log response from error or success
      const respError = op?.error as ResponseError
      if (respError) {
        const errorDetails = getErrorDetails(respError)
        const msgLowercare = errorDetails?.message?.toLowerCase()

        // some Timeout errors are coming as FetchError-s somehow (https://segment.atlassian.net/browse/CHANNELS-819)
        const isTimeoutError =
          msgLowercare?.includes('timeout') ||
          msgLowercare?.includes('timedout') ||
          msgLowercare?.includes('exceeded the deadline') ||
          errorDetails.code?.toLowerCase().includes('etimedout')

        // CHANNELS-651 somehow Timeouts are not retried by Integrations, this is fixing it
        if (isTimeoutError && !respError.status) respError.status = 408

        if (errorDetails.code) op.tags.push(`response_code:${errorDetails.code}`)
        if (errorDetails.status) op.tags.push(`response_status:${errorDetails.status}`)
        if (this.onResponse)
          try {
            this.onResponse({ error: respError, operation: op })
          } catch (e) {
            op.logs.push(`Error in onResponse: ${e}`)
          }
      } else {
        const resp: Awaited<ReturnType<RequestClient>> = op?.result
        if (resp && resp.status) op.tags.push(`response_status:${resp.status}`)
        if (this.onResponse)
          try {
            this.onResponse({ response: resp, operation: op })
          } catch (e) {
            op.logs.push(`Error in onResponse: ${e}`)
          }
      }
    })
    return await this.requestClient<Data>(url, options)
  }

  onResponse?(args: { response?: Awaited<ReturnType<RequestClient>>; error?: any; operation: OperationContext }): void

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

  rethrowIntegrationError(
    error: unknown,
    getWrapper: () => IntegrationError | ConstructorParameters<typeof IntegrationError>
  ): never {
    throw IntegrationErrorWrapper.wrap(error, getWrapper, this.currentOperation)
  }
}

function addUrlToLog(ctx: any) {
  //expected to be called for this.request operation only
  const ctxFull = ctx as OperationContext
  const argUrl = ctx.funcArgs?.[0] // first argument is url
  if (ctxFull.logs && argUrl) {
    ctxFull.logs.push(truncate(argUrl, { length: 70 }))
  }
}
