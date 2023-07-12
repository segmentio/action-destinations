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

  interface OperationSharedContext {
    /**
     * tags that will be added to all operation metrics
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
  abstract stats(args: StatsArgs): void

  beforeOperationTry(ctx: OperationContext): void {
    ctx.tags = []
    if (!ctx.sharedContext.tags) ctx.sharedContext.tags = []
  }

  mergeTags(...tagSets: (string[] | undefined)[]): string[] {
    const res: string[] = []
    for (const tags of tagSets) {
      if (tags) res.push(...tags)
    }
    return res.filter((t) => t)
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
        tags: this.mergeTags(ctx.sharedContext.tags, ctx.tags)
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
        tags: this.mergeTags(ctx.sharedContext.tags, ctx.tags)
      }
    })
  }

  beforeOperationFinally(ctx: OperationContext): void {
    const finallyTags: string[] = []
    if (ctx.state == 'finally') finallyTags.push(`error:${ctx.error ? 'true' : 'false'}`)
    if (ctx.error) {
      const error = ctx.error as TrackedError
      finallyTags.push(...(this.extractTagsFromError(error, ctx) || []))
    }
    ctx.tags.push(...finallyTags)
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
    return res
  }

  afterOperationFinally(ctx: OperationContext): void {
    const finallyTags = this.mergeTags(ctx.sharedContext.tags, ctx.tags)
    this.statsOperationEvent({
      context: ctx,
      event: 'finally',
      shouldStats: true,
      stats: { metric: `${ctx.operation}`, method: 'incr', value: 1, tags: [...finallyTags] }
    })

    if (ctx.duration !== undefined)
      this.statsOperationEvent({
        context: ctx,
        event: 'duration',
        shouldStats: true,
        stats: { metric: `${ctx.operation}.duration`, method: 'histogram', value: ctx.duration, tags: [...finallyTags] }
      })
  }
}

export type StatsMethod = 'incr' | 'histogram' | 'set'

export type StatsArgs = {
  method?: StatsMethod
  metric: string
  value?: number
  tags?: string[]
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
