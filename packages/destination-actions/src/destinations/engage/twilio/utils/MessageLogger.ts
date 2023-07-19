/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from '@segment/actions-core/destination-kit'
import { OperationLogger, OperationLoggerContext, TryCatchFinallyHook } from '../../operationTracking'
import { MessageSender } from './message-sender'

export const FLAGON_NAME_LOG_INFO = 'engage-messaging-log-info'
export const FLAGON_NAME_LOG_ERROR = 'engage-messaging-log-error'

export class MessageLogger extends OperationLogger {
  static getTryCatchFinallyHook(_ctx: OperationLoggerContext): TryCatchFinallyHook<OperationLoggerContext> {
    const msgSender = _ctx.funcThis as MessageSender<any>
    return msgSender?.logger
  }

  constructor(public messageSender: MessageSender<any>) {
    super()
    this.channelType = this.messageSender.getChannelType().toUpperCase()
  }
  readonly channelType: string
  get loggerClient(): Logger | undefined {
    return this.messageSender.executeInput.logger
  }
  readonly logDetails: Record<string, unknown> = {}

  logInfo(msg: string, metadata?: object): void {
    const msgs = [msg, ...(metadata ? [JSON.stringify(metadata)] : [])]
    if (!this.messageSender.isFeatureActive(FLAGON_NAME_LOG_INFO, () => false)) return
    const [firstMsg, ...rest] = msgs
    this.loggerClient?.info(
      `TE Messaging: ${this.channelType} ${firstMsg}`,
      ...rest,
      JSON.stringify({ ...this.logDetails, ...metadata })
    )
  }

  logError(msg: string, metadata?: object): void {
    if (!this.messageSender.isFeatureActive(FLAGON_NAME_LOG_ERROR, () => false)) return
    const msgPrefix = `TE Messaging: ${this.channelType}`
    this.loggerClient?.error(`${msgPrefix} ${msg}`, JSON.stringify({ ...this.logDetails, ...metadata }))
  }
}
