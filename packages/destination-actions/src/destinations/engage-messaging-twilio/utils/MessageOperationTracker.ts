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
  createTrackDecoratorFactory,
  TrackArgs
} from '../operationTracking'
import { MessageSender } from './message-sender'

export const FLAGON_NAME_LOG_INFO = 'engage-messaging-log-info'
export const FLAGON_NAME_LOG_ERROR = 'engage-messaging-log-error'

export class MessageOperationTracker extends OperationTracker {
  static Logger = class extends OperationLogger {
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
      this.loggerClient?.error(`${msgPrefix}} ${msg}`, JSON.stringify({ ...this.logDetails, ...metadata }))
    }
  }

  static Stats = class extends OperationStats {
    constructor(public messageSender: MessageSender<any>) {
      super()
      this.tags = this.messageSender.executeInput.statsContext?.tags ?? []
      this.tags.push(
        `space_id:${this.messageSender.settings.spaceId}`,
        `projectid:${this.messageSender.settings.sourceId}`,
        `region:${this.messageSender.settings.region}`,
        `channel:${this.messageSender.getChannelType()}`
      )
    }

    get statsClient(): StatsClient | undefined {
      return this.messageSender.executeInput.statsContext?.statsClient
    }
    readonly tags: StatsContext['tags']

    stats(statsArgs: StatsArgs): void {
      if (!this.statsClient) return
      const { method: statsMethod, metric, value, tags } = statsArgs
      //[statsArgs.method, statsArgs.metric, statsArgs.value, statsArgs.tags]
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
        ...(tags ?? [])
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
    return [new OperationDuration(), (this.logger = new MessageOperationTracker.Logger(this.messageSender)), this.stats]
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
export const track = createTrackDecoratorFactory<{ operationTracker: OperationTracker }>(
  (trackerContainer) => trackerContainer.operationTracker
)

/**
 * Creates a trackArgs.onError handler that let you wrap the operationContext.error with an IntegrationError unless current error is already an IntegrationError
 * @param args IntegrationError constructor args
 * @returns
 */
export function wrapIntegrationError(
  createIntegrationError: (op: OperationContext) => IntegrationError
): TrackArgs['onError']
export function wrapIntegrationError(
  integrationErrorConstructorArgs: ConstructorParameters<typeof IntegrationError>
): TrackArgs['onError']
export function wrapIntegrationError(args: unknown): TrackArgs['onError'] {
  return (ctx: OperationContext) => {
    const error = ctx.error
    if (!(error instanceof IntegrationError)) {
      if (args instanceof Function) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ctx.error = args(ctx)
      } else if (args instanceof Array) {
        ctx.error = new IntegrationError(...(args as ConstructorParameters<typeof IntegrationError>))
      }
    }
  }
}
