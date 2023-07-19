/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsClient, StatsContext } from '@segment/actions-core/destination-kit'
import {
  StatsArgs,
  OperationStats,
  OperationStatsContext,
  TryCatchFinallyHook,
  TrackedError
} from '../../utils/operationTracking'
import { MessageSender } from './message-sender'
import { OperationContext } from './track'
import { TwilioApiError } from './types'

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

    //for operations like request which can be used in multiple places, we need to have operation_path tag that will show where this operation is invoked from
    const parentOperation = (ctx as OperationContext).parent
    if (parentOperation) {
      const operation_path = this.getOperationNameTag(parentOperation as any)
      if (operation_path) ctx.tags.push('operation_path:' + operation_path)
    }
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

  extractTagsFromError(error: TrackedError, ctx: OperationStatsContext): string[] {
    const res = super.extractTagsFromError(error, ctx)

    const respError = error as TwilioApiError
    const error_code = respError?.response?.data?.code || respError?.code
    if (error_code) res.push(`error_code:${error_code}`)

    const error_status = respError?.response?.data?.status || respError?.status
    if (error_status) res.push(`error_status:${error_status}`)

    if (error.underlyingError) {
      const underlyingErrorTags = this.extractTagsFromError(error.underlyingError as any, ctx)
      res.push(...underlyingErrorTags.map((t) => `underlying_${t}`))
    }
    return res
  }

  /**
   * gets operation name that will be used for stats tags
   * @param ctx
   * @returns
   */
  getOperationNameTag(ctx: OperationStatsContext) {
    if (!ctx) return undefined
    //we want to have full path to the operation so we can distiguish getBody::request vs perform::request
    return this.messageSender.logger.getOperationName(ctx, true, '::') // '/' would be difficult to query in datadog, as it requires escaping
  }
}
