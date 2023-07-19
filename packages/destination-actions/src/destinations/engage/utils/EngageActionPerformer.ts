import { RequestClient } from '@segment/actions-core/create-request-client'
import { ExecuteInput } from '@segment/actions-core/destination-kit'
import { MaybePromise } from '@segment/actions-core/destination-kittypes'
import { MessageLogger } from './MessageLogger'
import { MessageStats } from './MessageStats'
import { OperationContext, track } from './track'
import { isDestinationActionService } from './isDestinationActionService'
import { TwilioApiError } from './TwilioApiError'
import { RequestOptions } from '@segment/actions-core/request-client'
import { IntegrationError } from '@segment/actions-core/errors'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'

export abstract class EngageActionPerformer<TSettings = any, TPayload = any, TReturn = any> {
  readonly logger: MessageLogger = new MessageLogger(this)
  readonly statsClient: MessageStats = new MessageStats(this)
  readonly currentOperation: OperationContext | undefined

  readonly payload: TPayload
  readonly settings: TSettings

  constructor(readonly requestClient: RequestClient, readonly executeInput: ExecuteInput<TSettings, TPayload>) {
    this.payload = executeInput.payload
    this.settings = executeInput.settings
  }

  @track()
  perform() {
    return this.doPerform()
  }

  abstract doPerform(): MaybePromise<TReturn>

  abstract getChannelType(): string

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
    return this.requestClient(url, options)
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
