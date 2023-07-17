/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'
import { StatsArgs, OperationStats, OperationStatsContext, TryCatchFinallyHook } from '../operationTracking'
import { MessageSender } from './message-sender'

export class MessageStats extends OperationStats {
  static getTryCatchFinallyHook(_ctx: OperationStatsContext): TryCatchFinallyHook<OperationStatsContext> {
    const msgSender = _ctx.funcThis as MessageSender<any>
    return msgSender?.statsClient
  }

  constructor(public messageSender: MessageSender<any>) {
    super()
  }

  onTry(ctx: OperationStatsContext): () => void {
    const res = super.onTry(ctx)
    ctx.sharedContext.tags.push(
      `space_id:${this.messageSender.settings.spaceId}`,
      `projectid:${this.messageSender.settings.sourceId}`,
      `region:${this.messageSender.settings.region}`,
      `channel:${this.messageSender.getChannelType()}`
    )
    return res
  }

  protected get statsClient(): StatsClient | undefined {
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
      ...(this.messageSender.executeInput.statsContext?.tags || []),
      ...(tags ?? [])
    ])
  }
}
