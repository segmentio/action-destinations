import { OperationContext } from './OperationContext'
import { OperationTrackHooks } from './OperationTrackHooks'
import { TrackedError } from './TrackedError'

declare module './OperationContext' {
  interface OperationContext {
    /**
     * tags collected during the operation that will be added to the operation completion metrics
     */
    tags: string[]
  }
}

declare module './OperationTracker' {
  interface TrackArgs {
    /**
     * should the method execution be tracked in stats at current ctx.state (try/catch/finally)?
     * False by default and true for Finally state
     */
    shouldStats?: (args: OperationStatsEventArgs) => boolean | void
  }
}

export abstract class OperationStats implements OperationTrackHooks {
  abstract stats<TStatsMethod extends StatsMethod>(args: StatsArgs<TStatsMethod>): void

  beforeOperationTry(ctx: OperationContext): void {
    ctx.tags = []
  }

  afterOperationTry(ctx: OperationContext) {
    this.statsOperationEvent({
      context: ctx,
      event: 'try',
      shouldStats: false,
      stats: {
        metric: `${ctx.operation}.try`,
        method: 'incr',
        value: 1,
        extraTags: [...(ctx.tags?.filter((t) => t) || [])]
      }
    })
  }

  statsOperationEvent(args: OperationStatsEventArgs) {
    if (args.context.trackArgs?.shouldStats) {
      const shouldStats = args.context.trackArgs.shouldStats(args)
      if (shouldStats !== undefined) args.shouldStats = shouldStats
    }
    if (args.shouldStats && args.stats) {
      this.stats(args.stats)
    }
  }

  afterOperationPrepareError(ctx: OperationContext): void {
    this.statsOperationEvent({
      context: ctx,
      event: 'catch',
      shouldStats: false,
      stats: {
        metric: `${ctx.operation}.catch`,
        method: 'incr',
        value: 1,
        extraTags: [...(ctx.tags?.filter((t) => t) || [])]
      }
    })
  }

  beforeOperationFinally(ctx: OperationContext): void {
    ctx.tags.push(...(this.extractTags(ctx) || []))
  }

  afterOperationFinally(ctx: OperationContext): void {
    const finallyTags = ctx.tags?.filter((t) => t) || []
    this.statsOperationEvent({
      context: ctx,
      event: 'finally',
      shouldStats: true,
      stats: { metric: `${ctx.operation}`, method: 'incr', extraTags: finallyTags, value: 1 }
    })

    if (ctx.duration !== undefined)
      this.statsOperationEvent({
        context: ctx,
        event: 'duration',
        shouldStats: true,
        stats: { metric: `${ctx.operation}.duration`, method: 'histogram', extraTags: finallyTags, value: ctx.duration }
      })
  }

  /**
   * Extracts all stats tags for the operation's completion metrics
   * @param ctx operation context
   * @returns
   */
  extractTags(ctx: OperationContext): string[] {
    const res: string[] = []
    res.push(`error:${ctx.error ? 'true' : 'false'}`)
    if (ctx.error) {
      const error = ctx.error as TrackedError
      res.push(...(this.extractTagsFromError(error, ctx) || []))
    }

    return res
  }

  /**
   * Called by extractTags to extract tags from the error. The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to extract tags from
   * @param ctx operation context (may be different from the error.trackedContext)
   * @returns
   */
  extractTagsFromError(error: TrackedError, ctx: OperationContext): string[] {
    const res: string[] = []
    const errorContext = error.trackedContext
    res.push(`error_operation:${errorContext?.operation || ctx.operation}`)
    res.push(`error_class:${error?.constructor?.name || typeof error}`)
    // for all upstream operations add error tags
    if (error.tags /* && error.trackedContext == ctx */) res.push(...error.tags)

    return res
  }
}

export type StatsMethod = 'incr' | 'histogram' | 'set'

export type StatsArgs<TStatsMethod extends StatsMethod = StatsMethod> = {
  method?: TStatsMethod
  metric: string
  value?: number
  extraTags?: string[]
}

export type OperationStatsEvent = OperationContext['state'] | 'duration'
/**
 * configuration of the operation event to stats
 */

export interface OperationStatsEventArgs {
  event: OperationStatsEvent
  context: OperationContext
  stats: StatsArgs
  shouldStats: boolean
}
