/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from '@segment/actions-core/destination-kit'
import { OperationLogger, OperationLoggerContext, TryCatchFinallyHook } from './operationTracking'
import { EngageActionPerformer } from './EngageActionPerformer'
import { getErrorDetails } from './ResponseError'

export const FLAGON_NAME_LOG_INFO = 'engage-messaging-log-info'
export const FLAGON_NAME_LOG_ERROR = 'engage-messaging-log-error'

export class EngageLogger extends OperationLogger {
  static getTryCatchFinallyHook(_ctx: OperationLoggerContext): TryCatchFinallyHook<OperationLoggerContext> {
    const msgSender = _ctx.funcThis as EngageActionPerformer
    return msgSender?.logger
  }

  constructor(public actionPerformer: EngageActionPerformer) {
    super()
    this.channelType = this.actionPerformer.getChannelType().toUpperCase()
  }
  readonly channelType: string
  get loggerClient(): Logger | undefined {
    return this.actionPerformer.executeInput.logger
  }
  readonly logDetails: Record<string, unknown> = {}

  logInfo(msg: string, metadata?: object): void {
    const msgs = [msg, ...(metadata ? [JSON.stringify(metadata)] : [])]
    if (!this.actionPerformer.isFeatureActive(FLAGON_NAME_LOG_INFO, () => false)) return
    const [firstMsg, ...rest] = msgs
    this.loggerClient?.info(
      `TE Messaging: ${this.channelType} ${firstMsg}`,
      ...rest,
      JSON.stringify({ ...this.logDetails, ...metadata })
    )
  }

  logError(msg: string, metadata?: object): void {
    if (!this.actionPerformer.isFeatureActive(FLAGON_NAME_LOG_ERROR, () => false)) return
    const msgPrefix = `⛔ TE Messaging: ${this.channelType}`
    this.loggerClient?.error(`${msgPrefix} ${msg}`, JSON.stringify({ ...this.logDetails, ...metadata }))
  }
  error(msg: string, metadata?: object) {
    return this.logError(msg, metadata)
  }
  info(msg: string, metadata?: object) {
    return this.logInfo(msg, metadata)
  }

  getErrorMessage(error: unknown) {
    const errorDetails = getErrorDetails(error)
    let res = `${errorDetails.message}`
    if (errorDetails.code) res += `. Code: ${errorDetails.code}`
    if (errorDetails.status) res += `. Status: ${errorDetails.status}`
    return res
  }
}
