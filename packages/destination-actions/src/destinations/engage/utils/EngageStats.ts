/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsClient } from '@segment/actions-core/destination-kit'
import {
  StatsArgs,
  OperationStats,
  OperationStatsContext,
  TryCatchFinallyHook,
  TrackedError
} from './operationTracking'
import { EngageActionPerformer } from './EngageActionPerformer'
import { OperationContext } from './track'
import { getErrorDetails } from './ResponseError'

export class EngageStats extends OperationStats {
  static getTryCatchFinallyHook(_ctx: OperationStatsContext): TryCatchFinallyHook<OperationStatsContext> {
    const msgSender = _ctx.funcThis as EngageActionPerformer
    return msgSender?.statsClient
  }

  constructor(public actionPerformer: EngageActionPerformer) {
    super()
  }

  onTry(ctx: OperationStatsContext): () => void {
    const res = super.onTry(ctx)
    ctx.sharedContext.tags.push(
      `space_id:${this.actionPerformer.settings.spaceId}`,
      `projectid:${this.actionPerformer.settings.sourceId}`,
      `settings_region:${this.actionPerformer.settings.region}`,
      `channel:${this.actionPerformer.getChannelType()}`
    )

    //for operations like request which can be used in multiple places, we need to have operation_path tag that will show where this operation is invoked from
    const parentOperation = (ctx as OperationContext).parent
    if (parentOperation) {
      const operation_path = this.getOperationNameTag(parentOperation as any)
      if (operation_path) ctx.tags.push('operation_path:' + operation_path)
    }
    return res
  }

  get statsClient(): StatsClient | undefined {
    return this.actionPerformer.executeInput.statsContext?.statsClient
  }
  get tags() {
    if (this.actionPerformer.currentOperation?.tags) return this.actionPerformer.currentOperation.tags
    if (this.actionPerformer.executeInput.statsContext?.tags)
      return this.actionPerformer.executeInput.statsContext?.tags
    return this._tags
  }
  _tags: string[] = []

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

    statsFunc?.(
      `${this.actionPerformer.getIntegrationStatsName()}.${metric}`,
      typeof value === 'undefined' ? 1 : value,
      [...(this.actionPerformer.executeInput.statsContext?.tags || []), ...(tags ?? [])]
    )
  }

  incr(metric: string, value?: number, tags?: string[]) {
    this.stats({ metric, value, tags, method: 'incr' })
  }
  histogram(metric: string, value?: number, tags?: string[]) {
    this.stats({ metric, value, tags, method: 'histogram' })
  }
  set(metric: string, value?: number, tags?: string[]) {
    this.stats({ metric, value, tags, method: 'set' })
  }

  extractTagsFromError(error: TrackedError, ctx: OperationStatsContext): string[] {
    const res = super.extractTagsFromError(error, ctx)

    const errDetails = getErrorDetails(error)
    if (errDetails?.code) res.push(`error_code:${errDetails.code}`)
    if (errDetails?.status) res.push(`error_status:${errDetails.status}`)

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
    return this.actionPerformer.logger.getOperationName(ctx, true, '::') // '/' would be difficult to query in datadog, as it requires escaping
  }
}
