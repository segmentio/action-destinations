import { IntegrationError } from '@segment/actions-core'
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import {
  StatsArgs,
  TrackedError,
  OperationStats,
  OperationStatsContext,
  TryCatchFinallyHook
} from '../operationTracking'
import { MessageSender } from './message-sender'
import { OperationContext } from './track'

export class MessageStats extends OperationStats {
  static getTryCatchFinallyHook(_ctx: OperationStatsContext): TryCatchFinallyHook<OperationStatsContext> {
    const msgSender = _ctx.funcThis as MessageSender<any>
    return msgSender?.statsClient
  }

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
