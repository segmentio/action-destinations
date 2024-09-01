/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestClient } from '@segment/actions-core/create-request-client'
import { EngageDestinationCache, ExecuteInput } from '@segment/actions-core/destination-kit'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { EngageLogger } from './EngageLogger'
import { EngageStats } from './EngageStats'
import { OperationContext, track } from './track'
import { isDestinationActionService } from './isDestinationActionService'
import { ResponseError, getErrorDetails } from './ResponseError'
import { RequestOptions } from '@segment/actions-core/request-client'
import { IntegrationError } from '@segment/actions-core'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'
import { Awaited, StatsTags, StatsTagsMap } from './operationTracking'
import truncate from 'lodash/truncate'
import { isRetryableError } from './isRetryableError'
import { CachedError, CachedValueFactory } from './CachedResponse'

/**
 * Base class for all Engage Action Performers. Supplies common functionality like logger, stats, request, operation tracking
 */
export abstract class EngageActionPerformer<TSettings = any, TPayload = any, TReturn = any> {
  readonly logger: EngageLogger
  readonly statsClient: EngageStats
  readonly engageDestinationCache: EngageDestinationCache | undefined
  readonly currentOperation: OperationContext | undefined

  readonly payload: TPayload
  readonly settings: TSettings

  constructor(readonly requestClient: RequestClient, readonly executeInput: ExecuteInput<TSettings, TPayload>) {
    this.payload = executeInput.payload
    this.settings = executeInput.settings
    this.engageDestinationCache = executeInput.engageDestinationCache
    this.logger = new EngageLogger(this)
    this.statsClient = new EngageStats(this)
  }

  beforePerform?(): void | Promise<void>

  @track()
  async perform() {
    await this.beforePerform?.()

    // increment the perform_attempt metric - was done after noticing that some actions are not achieving the finally block of the operation (possibly due to process/pod termination)
    this.statsIncr('perform_attempt')
    return this.doPerform()
  }

  abstract doPerform(): MaybePromise<TReturn>

  /**
   * gets the name of the integration used as a prefix for all stats metrics under this Action Performer
   */
  abstract getIntegrationStatsName(): string
  /**
   * used for stats tag of all metrics under this performer + for all log messages
   */
  abstract getChannelType(): string

  @track({
    onTry: addUrlToLog,
    onFinally: addUrlToLog
  })
  async request<Data = unknown>(url: string, options?: RequestOptions) {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      // log response from error or success
      const respError = op?.error as ResponseError
      if (respError) {
        const errorDetails = getErrorDetails(respError)
        const msgLowercare = errorDetails?.message?.toLowerCase()

        // some Timeout errors are coming as FetchError-s somehow (https://segment.atlassian.net/browse/CHANNELS-819)
        const isTimeoutError =
          msgLowercare?.includes('timeout') ||
          msgLowercare?.includes('timedout') ||
          msgLowercare?.includes('exceeded the deadline') ||
          errorDetails.code?.toLowerCase().includes('etimedout')

        // CHANNELS-651 somehow Timeouts are not retried by Integrations, this is fixing it
        if (isTimeoutError) {
          const status = errorDetails.status ?? respError.status ?? 408
          respError.status = status
          errorDetails.status = status

          const errorCode = errorDetails.code ?? respError.code ?? 'etimedout'
          respError.code = errorCode
          errorDetails.code = errorCode
          respError.retry = true
        }

        if (errorDetails.code) op.tags.push(`response_code:${errorDetails.code}`)
        if (errorDetails.status) op.tags.push(`response_status:${errorDetails.status}`)
        if (this.onResponse)
          try {
            this.onResponse({ error: respError, operation: op })
          } catch (e) {
            op.logs.push(`Error in onResponse: ${e}`)
          }
      } else {
        const resp: Awaited<ReturnType<RequestClient>> = op?.result
        if (resp && resp.status) op.tags.push(`response_status:${resp.status}`)
        if (this.onResponse)
          try {
            this.onResponse({ response: resp, operation: op })
          } catch (e) {
            op.logs.push(`Error in onResponse: ${e}`)
          }
      }
    })
    return await this.requestClient<Data>(url, options)
  }

  onResponse?(args: { response?: Awaited<ReturnType<RequestClient>>; error?: any; operation: OperationContext }): void

  redactPii(pii: string | undefined) {
    if (!pii) {
      return pii
    }

    if (pii.length <= 8) {
      return '***'
    }
    return pii.substring(0, 3) + '***' + pii.substring(pii.length - 3)
  }

  isFeatureActive(featureName: string, getDefault?: () => boolean) {
    if (isDestinationActionService()) return true
    if (!this.executeInput.features || !(featureName in this.executeInput.features)) return getDefault?.()
    return this.executeInput.features[featureName]
  }

  logInfo(msg: string, metadata?: object) {
    this.logger.logInfo(msg, metadata)
  }
  logError(msg: string, metadata?: object) {
    this.logger.logError(msg, metadata)
  }
  /**
   * Add a message to the log of current tracked operation, only if error happens during current operation. You can add some arguments here
   * @param getLogMessage
   */
  logOnError(logMessage: string | ((ctx: OperationContext) => string)) {
    const op = this.currentOperation
    op?.onFinally.push(() => {
      if (op.error) {
        const msg = typeof logMessage === 'function' ? logMessage(op) : logMessage
        op.logs.push(msg)
      }
    })
  }

  statsIncr(metric: string, value?: number, tags?: StatsTags) {
    this.statsClient.stats({ method: 'incr', metric, value, tags })
  }

  statsHistogram(metric: string, value: number, tags?: string[]) {
    this.statsClient.stats({ method: 'histogram', metric, value, tags })
  }

  statsSet(metric: string, value: number, tags?: string[]) {
    this.statsClient.stats({ method: 'set', metric, value, tags })
  }

  get logDetails(): Record<string, unknown> {
    return this.logger.logDetails
  }

  get tags(): string[] {
    return this.statsClient.tags
  }

  rethrowIntegrationError(
    error: unknown,
    getWrapper: () => IntegrationError | ConstructorParameters<typeof IntegrationError>
  ): never {
    throw IntegrationErrorWrapper.wrap(error, getWrapper, this.currentOperation)
  }

  @track()
  async getOrAddCache<T>(
    key: string,
    createValue: () => Promise<T>,
    options: {
      /**
       * The group of cache used for stats tags
       */
      cacheGroup?: string
      serializer?: CacheSerializer<T>
      expiryInSeconds?: number
      lockOptions?: Parameters<typeof EngageActionPerformer.prototype.withDistributedLock>[2]
    }
  ): Promise<T> {
    const cache_group = options.cacheGroup || this.currentOperation?.parent?.func.name || ''
    const finalStatsTags: StatsTagsMap & { cache_hit: boolean } = {
      cache_group,
      cache_hit: false
    }

    this.currentOperation?.onFinally.push(() => {
      this.currentOperation?.tags.push(...this.statsClient.tagsMapToArray(finalStatsTags))
    })

    if (!this.engageDestinationCache) return createValue()

    const serializer = options.serializer || DefaultSerializer

    const cacheRead = await getOrCatch(() => this.engageDestinationCache!.getByKey(key))

    // we respect lockOptions only if cache is not found and no error happened while reading cache
    if (options.lockOptions && !(cacheRead.error || cacheRead.value)) {
      if (!options.lockOptions.cacheGroup) options.lockOptions.cacheGroup = cache_group
      return this.withDistributedLock(
        `cache:${key}`,
        () => this.getOrAddCache(key, createValue, { ...options, lockOptions: undefined }),
        options.lockOptions
      )
    }

    if (cacheRead.error) {
      finalStatsTags.cache_reading_error = true
      this.logInfo('cache_reading_error', { key, cacheGroup: cache_group })
    } else if (cacheRead.value) {
      const { value: parsedCache, error: parsingError } = getOrCatch(() => serializer.parse(cacheRead.value!))

      if (parsingError) {
        //exception happened while parsing the cache.
        // Log it and execute as if we don't have cache
        finalStatsTags.cache_parsing_error = true
        this.logInfo('cache_parsing_error', { key, value: cacheRead.value, parsingError })
      } else if (parsedCache) {
        //parsed cache successfully && cache is not expired
        // parsedValue - either value or error was parsed
        finalStatsTags.cache_hit = true
        finalStatsTags.cached_error = !!parsedCache?.error
        this.statsIncr('cache_hit', 1, finalStatsTags)
        if (parsedCache?.error) throw parsedCache.error
        return parsedCache.value
      } else {
        //cache parsed successfully but cache needs to be ignored (e.g. expired) - re-execute
        finalStatsTags.cache_ignored = true
        this.logInfo('cache_ignored', { key, value: cacheRead.value, cacheGroup: cache_group })
      }
    }
    // re-executing, because cache not found or ignored or failed to read or parse
    finalStatsTags.cache_hit = false
    this.statsIncr('cache_miss', 1, finalStatsTags)
    this.logInfo('cache_miss', { key, cacheGroup: cache_group })
    const { value: result, error: resultError } = await getOrCatch(() => createValue())

    //before returning result - we need to try to serialize it and store it in cache
    const stringified = getOrCatch(() => serializer.stringify(resultError ? { error: resultError } : { value: result }))
    if (stringified.error) {
      finalStatsTags.cache_stringify_error = true
      this.logInfo('cache_stringify_error', { key, error: stringified.error, cacheGroup: cache_group })
    } else if (stringified.value) {
      //result stringified and contains cacheable value - cache it
      const { error: cacheSavingError } = await getOrCatch(() =>
        this.engageDestinationCache!.setByKey(key, stringified.value!, options.expiryInSeconds)
      )
      if (cacheSavingError) {
        finalStatsTags.cache_saving_error = true
        this.logInfo('cache_saving_error', { key, error: cacheSavingError, cacheGroup: cache_group })
      }
    }

    if (resultError) throw resultError
    else return result as T
  }

  @track()
  async withDistributedLock<T>(
    key: string,
    createValue: () => Promise<T>,
    options: {
      acquireLockMaxWaitTimeMs: number
      acquireLockRetryIntervalMs?: number
      lockMaxTimeMs: number
      cacheGroup?: string
    }
  ): Promise<T> {
    const redisClient = (this.engageDestinationCache as any)?.redis
    const cache_group = options.cacheGroup || this.currentOperation?.parent?.func.name || ''
    const statsTags: StatsTagsMap = { cache_group }
    this.currentOperation?.onFinally.push(() => {
      this.currentOperation?.tags.push(...this.statsClient.tagsMapToArray(statsTags))
    })

    if (!redisClient) {
      return await createValue()
    }

    /**
     * LOGIC:
     * Trying to aquire lock. Possible outcomes:
     * 1. Lock acquired:
     *    - createValue() and finally release lock
     * 2. Lock not acquired because of timeout:
     *   - throw timeout error up
     * 3. Lock not acquired because of error accessing redis:
     *   - fallback to createValue()
     */

    const lockKey = `engage-messaging-lock:${key}`
    const acquireLock = async () => {
      //tries to acquire lock for acquireLockMaxWaitInSeconds seconds
      statsTags.lock_acquired = false
      const startTime = Date.now()
      while (Date.now() - startTime < options.acquireLockMaxWaitTimeMs) {
        if ((await redisClient.set(lockKey, 'locked', 'NX', 'PX', options.lockMaxTimeMs)) === 'OK') {
          // lock acquired, returning release function
          statsTags.lock_acquired = true
          return {
            release: async () => await redisClient.del(lockKey)
          }
        }
        await new Promise((resolve) => setTimeout(resolve, options.acquireLockRetryIntervalMs || 500)) // Wait 500ms before retrying
      }
      //no lock acquired because of waiting timeout
      return
    }

    const { value: lock, error: redisError } = await getOrCatch(() => acquireLock())

    if (redisError || lock?.release)
      //if lock obtained or there was redis error - execute createValue and finally release lock
      try {
        if (redisError) {
          this.logInfo('lock_acquire_error', { key, redisError, statsTags })
          statsTags.lock_acquired_error = true
        }
        return await createValue()
      } finally {
        const { error: releaseError } = lock?.release ? await getOrCatch(() => lock.release()) : { error: undefined }
        if (releaseError) {
          this.logInfo('lock_release_error', { key, releaseError, statsTags })
          statsTags.lock_release_error = true
        }
      }
    else {
      // no redis error and no lock acquired - means it was acquiring timeout
      const acquireLockTimeoutError = new IntegrationError('Timeout while acquiring lock', 'ETIMEDOUT', 500)
      acquireLockTimeoutError.retry = true
      throw acquireLockTimeoutError
    }
  }
}

function addUrlToLog(ctx: any) {
  //expected to be called for this.request operation only
  const ctxFull = ctx as OperationContext
  const argUrl = ctx.funcArgs?.[0] // first argument is url
  if (ctxFull.logs && argUrl) {
    ctxFull.logs.push(truncate(argUrl, { length: 70 }))
  }
}

type ValueOrError<T> = { value?: T; error?: any } //& ({ value: T } | { error: any });

function getOrCatch<T>(getValue: () => Promise<T>): Promise<ValueOrError<T>>
function getOrCatch<T>(getValue: () => T): ValueOrError<T>
function getOrCatch(getValue: () => any): Promise<ValueOrError<any>> | ValueOrError<any> {
  try {
    const value = getValue()

    if (value instanceof Promise) {
      return value.then((value) => ({ value })).catch((error) => ({ error }))
    } else {
      return { value }
    }
  } catch (error) {
    return { error }
  }
}

export type CacheSerializer<T> = {
  /**
   * Stringyfies value or error to string
   * @param cacheable value or error to be stringified
   * @returns if undefined returned, then the value will not be cached
   */
  stringify: (cacheable: ValueOrError<T>) => string | void
  /**
   * parses cached string to value or error
   * @param cachedValue
   * @returns if undefined returned, then the cache is either corrupted or expired and will be re-executed
   */
  parse: (cachedValue: string) => ValueOrError<T> | void
}

/**
 * Default serializer that supports caching of non-retriable error as well as any JSON.stringify-able value
 */
export const DefaultSerializer: CacheSerializer<any> = {
  stringify: (valueOrError) => {
    let cacheObj = undefined
    if (valueOrError.error && !isRetryableError(valueOrError.error)) {
      const errorDetails = getErrorDetails(valueOrError.error)
      if (errorDetails?.status) {
        cacheObj = { error: new CachedError(errorDetails.status, errorDetails.message, errorDetails.code).serialize() }
      }
    } else if (valueOrError.value !== undefined) {
      cacheObj = { value: valueOrError.value }
    }
    return cacheObj ? JSON.stringify(cacheObj) : undefined
  },

  parse: (cachedValue) => {
    const parsedValOrError = JSON.parse(cachedValue) as { value?: any; error?: string }
    if (parsedValOrError.error) {
      const parsed = CachedValueFactory.fromString(parsedValOrError.error) as CachedError
      const error = new IntegrationError(parsed.message, parsed.code, parsed.status)
      error.retry = false
      return { error }
    } else if (parsedValOrError.value !== undefined) {
      return { value: parsedValOrError.value }
    }
  }
}
