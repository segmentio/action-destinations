import { OperationDuration } from './OperationDuration'
import { TrackedError } from './TrackedError'
import { OperationDecorator } from './OperationDecorator'
import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'
export type OperationStatsContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> = TContext & {
  /**
   * tags collected during the operation that will be added to the operation completion metrics
   */
  tags: string[]
  sharedContext: {
    /**
     * tags that will be added to all operation metrics
     */
    tags: string[]
  }

  decoratorArgs?: {
    /**
     * should the method execution be tracked in stats at current ctx.state (try/catch/finally)?
     * False by default and true for Finally state
     */
    shouldStats?: (args: OperationStatsEventArgs) => boolean | void
  }
}

/**
 * Base class
 */
export abstract class OperationStats<TContext extends OperationStatsContext = OperationStatsContext>
  implements TryCatchFinallyHook<TContext>
{
  static getTryCatchFinallyHook(_ctx: OperationStatsContext): TryCatchFinallyHook<OperationStatsContext> {
    throw new Error('OperationStats.getTryCatchFinallyHook is abstract and must be implemented by derived class')
  }
  abstract stats(args: StatsArgs): void

  getMetricName(ctx: OperationStatsContext): string | undefined {
    const opName = OperationDecorator.getOperationName(ctx)
    if (!opName) return undefined

    switch (ctx.stage) {
      case 'try':
        return `${opName}.try`
      case 'catch':
        return `${opName}.catch`
      case 'finally':
      default:
        return `${opName}`
    }
  }

  onTry(ctx: OperationStatsContext) {
    ctx.tags = []
    if (!ctx.sharedContext.tags) ctx.sharedContext.tags = []
    return () => {
      const metricName = this.getMetricName(ctx)
      if (metricName)
        this.statsOperationEvent({
          context: ctx,
          event: 'try',
          shouldStats: false,
          stats: {
            metric: metricName,
            method: 'incr',
            value: 1,
            tags: this.mergeTags(ctx.sharedContext.tags, ctx.tags)
          }
        })
    }
  }

  mergeTags(...tagSets: (string[] | undefined)[]): string[] {
    const res: string[] = []
    for (const tags of tagSets) {
      if (tags) res.push(...tags)
    }
    return res.filter((t) => t)
  }

  statsOperationEvent(args: OperationStatsEventArgs) {
    if (args.context.decoratorArgs?.shouldStats) {
      const shouldStats = args.context.decoratorArgs.shouldStats(args)
      if (shouldStats !== undefined) args.shouldStats = shouldStats
    }
    if (args.shouldStats && args.stats) {
      this.stats(args.stats)
    }
  }

  onCatch(ctx: OperationStatsContext) {
    const metricName = this.getMetricName(ctx)
    if (metricName)
      this.statsOperationEvent({
        context: ctx,
        event: ctx.stage,
        shouldStats: false, //by default: do not stats (can be overriden by decoratorArgs.shouldStats)
        stats: {
          metric: metricName,
          method: 'incr',
          value: 1,
          tags: this.mergeTags(ctx.sharedContext.tags, ctx.tags)
        }
      })
  }

  onFinally(ctx: OperationStatsContext) {
    const finallyTags: string[] = []
    if (ctx.stage == 'finally') finallyTags.push(`error:${ctx.error ? 'true' : 'false'}`)
    if (ctx.error) {
      const error = ctx.error as TrackedError
      finallyTags.push(...(this.extractTagsFromError(error, ctx) || []))
    }
    ctx.tags.push(...finallyTags)
    return () => {
      const finallyTags = this.mergeTags(ctx.sharedContext.tags, ctx.tags)
      const metricName = this.getMetricName(ctx)
      if (metricName)
        this.statsOperationEvent({
          context: ctx,
          event: 'finally',
          shouldStats: true,
          stats: { metric: metricName, method: 'incr', value: 1, tags: [...finallyTags] }
        })

      const duration = OperationDuration.getDuration(ctx)
      const histogramMetric = this.getHistogramMetric(ctx)
      if (duration !== undefined && histogramMetric)
        this.statsOperationEvent({
          context: ctx,
          event: 'duration',
          shouldStats: true,
          stats: { metric: histogramMetric, method: 'histogram', value: duration, tags: [...finallyTags] }
        })
    }
  }

  getHistogramMetric(ctx: OperationStatsContext) {
    const opName = OperationDecorator.getOperationName(ctx)
    if (!opName) return undefined
    return `${opName}.duration`
  }

  /**
   * Called by extractTags to extract tags from the error. The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to extract tags from
   * @param ctx operation context (may be different from the error.trackedContext)
   * @returns
   */
  extractTagsFromError(error: TrackedError, ctx: OperationStatsContext): string[] {
    const res: string[] = []
    const errorOperation = this.getErrorOperationNameTag(error, ctx)
    if (errorOperation) res.push(`error_operation:${errorOperation}`)
    res.push(`error_class:${error?.constructor?.name || typeof error}`)
    return res
  }

  /**
   * gets the value for the tag error_operation which attached to the metric on error
   * @param error
   * @param ctx
   * @returns
   */
  getErrorOperationNameTag(error: TrackedError, ctx: OperationStatsContext): string | undefined {
    const errorContext = error.trackedContext as OperationStatsContext
    return errorContext ? this.getOperationNameTag(errorContext) : this.getOperationNameTag(ctx)
  }

  /**
   * gets operation name that will be used for stats tags
   * @param ctx
   * @returns
   */
  getOperationNameTag(ctx: OperationStatsContext) {
    return OperationDecorator.getOperationName(ctx)
  }
}

export type StatsMethod = 'incr' | 'histogram' | 'set'

export type StatsArgs = {
  method?: StatsMethod
  metric: string
  value?: number
  tags?: string[]
}

export type OperationStatsEvent = OperationStatsContext['stage'] | 'duration'
/**
 * configuration of the operation event to stats
 */

export interface OperationStatsEventArgs {
  event: OperationStatsEvent
  context: OperationStatsContext
  stats: StatsArgs
  shouldStats: boolean
}
