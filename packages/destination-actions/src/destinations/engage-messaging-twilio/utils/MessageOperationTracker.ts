/* eslint-disable @typescript-eslint/no-explicit-any */
import { IntegrationError } from '@segment/actions-core'
import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import {
  StatsArgs,
  TrackedError,
  OperationContext,
  OperationTracker,
  OperationLogger,
  OperationStats,
  OperationDuration,
  createTrackDecoratorFactory
} from '../operationTracking'
import { MessageSender } from './message-sender'

export const FLAGON_NAME_LOG_INFO = 'engage-messaging-log-info'
export const FLAGON_NAME_LOG_ERROR = 'engage-messaging-log-error'

export class MessageOperationTracker extends OperationTracker {
  static Logger = class extends OperationLogger {
    constructor(public messageSender: MessageSender<any>) {
      super()
      this.loggerClient = messageSender.executeInput.logger
    }
    readonly loggerClient: Logger | undefined
    readonly logDetails: Record<string, unknown> = {}

    logInfo(msg: string, metadata?: object): void {
      const msgs = [msg, ...(metadata ? [JSON.stringify(metadata)] : [])]
      if (!this.messageSender.isFeatureActive(FLAGON_NAME_LOG_INFO, () => false)) return
      const [firstMsg, ...rest] = msgs
      this.loggerClient?.info(
        `TE Messaging: ${this.messageSender.getChannelType().toUpperCase()} ${firstMsg}`,
        ...rest,
        JSON.stringify({ ...this.logDetails, ...metadata })
      )
    }

    logError(msg: string, metadata?: object): void {
      if (!this.messageSender.isFeatureActive(FLAGON_NAME_LOG_ERROR, () => false)) return
      const msgPrefix = `TE Messaging: ${this.messageSender.getChannelType().toUpperCase()}`
      this.loggerClient?.error(`${msgPrefix}} ${msg}`, JSON.stringify({ ...this.logDetails, ...metadata }))
    }
  }

  static Stats = class extends OperationStats {
    constructor(public messageSender: MessageSender<any>) {
      super()
      this.statsClient = this.messageSender.executeInput.statsContext?.statsClient
      this.tags = this.messageSender.executeInput.statsContext?.tags ?? []
      this.tags.push(
        `space_id:${this.messageSender.settings.spaceId}`,
        `projectid:${this.messageSender.settings.sourceId}`,
        `region:${this.messageSender.settings.region}`,
        `channel:${this.messageSender.getChannelType()}`
      )
    }

    readonly statsClient: StatsClient | undefined
    readonly tags: StatsContext['tags']

    stats(statsArgs: StatsArgs): void {
      if (!this.statsClient) return
      const { method: statsMethod, metric, value, extraTags } = statsArgs
      //[statsArgs.method, statsArgs.metric, statsArgs.value, statsArgs.extraTags]
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

    extractTagsFromError(error: TrackedError, ctx: OperationContext) {
      const res = super.extractTagsFromError(error, ctx)
      if (error instanceof IntegrationError) {
        if (error.code) res.push(`error_code:${error.code}`)
        if (error.status) res.push(`error_status:${error.status}`)
      }
      return res
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(readonly messageSender: MessageSender<any>) {
    super()
  }

  logger = new MessageOperationTracker.Logger(this.messageSender)
  stats = new MessageOperationTracker.Stats(this.messageSender)

  initHooks() {
    return [new OperationDuration(), this.logger, this.stats]
  }

  onOperationPrepareError(ctx: OperationContext) {
    //if error is already integration error we don't run trackArgs.onError
    if (ctx.error instanceof IntegrationError) return
    super.onOperationPrepareError(ctx)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
export const track = createTrackDecoratorFactory<{ operationTracker: OperationTracker }>(
  (trackerContainer) => trackerContainer.operationTracker
)
