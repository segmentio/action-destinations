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
import { IntegrationError } from '@segment/actions-core/errors'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'

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

  @track()
  async request(url: string, options: RequestOptions) {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      // log response from error or success
      const respError = op?.error as ResponseError
      const errorDetails = getErrorDetails(respError)
      if (errorDetails.code) op.tags.push(`response_code:${errorDetails.code}`)
      if (errorDetails.status) op.tags.push(`response_status:${errorDetails.status}`)
    })
    return await this.requestClient(url, options)
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

  rethrowIntegrationError(
    error: unknown,
    getWrapper: () => IntegrationError | ConstructorParameters<typeof IntegrationError>
  ): never {
    throw IntegrationErrorWrapper.wrap(error, getWrapper, this.currentOperation)
  }
}
