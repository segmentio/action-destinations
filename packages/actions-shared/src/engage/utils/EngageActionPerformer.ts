/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestClient } from '@segment/actions-core/create-request-client'
import { EngageDestinationCache, ExecuteInput } from '@segment/actions-core/destination-kit'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { EngageLogger } from './EngageLogger'
import { EngageStats } from './EngageStats'
import { OperationContext, track } from './track'
import { isDestinationActionService } from './isDestinationActionService'
import { ErrorDetails, ResponseError, getErrorDetails } from './ResponseError'
import { RequestOptions } from '@segment/actions-core/request-client'
import { IntegrationError } from '@segment/actions-core'
import { IntegrationErrorWrapper } from './IntegrationErrorWrapper'
import { Awaited, StatsTags, StatsTagsMap } from './operationTracking'
import truncate from 'lodash/truncate'
import { isRetryableError } from './isRetryableError'
import { getOrCatch, ValueOrError } from './getOrCatch'
import { backoffRetryPolicy, getOrRetry, RetryArgs } from './getOrRetry'

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

  statsHistogram(metric: string, value: number, tags?: StatsTags) {
    this.statsClient.stats({ method: 'histogram', metric, value, tags })
  }

  statsSet(metric: string, value: number, tags?: StatsTags) {
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

  /**
   *
   * @param message
   * @param code
   * @throws {IntegrationError} with retry flag set to true
   */
  throwRetryableError(message: string, code = 'ETIMEDOUT'): never {
    const error = new IntegrationError(message, code, 500)
    error.retry = true
    throw error
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
      lockOptions?: LockOptions
      saveRetry?: RetryArgs
      onSaveFailed?: (error: Error) => void
    }
  ): Promise<T> {
    const cache_group = options.cacheGroup || this.currentOperation?.parent?.func.name || ''
    const finalStatsTags: StatsTagsMap & { cache_hit: boolean; cache_step: string } = {
      cache_group,
      cache_hit: false,
      withLock: !!options.lockOptions,
      cache_step: 'init'
    }

    this.currentOperation?.onFinally.push(() => {
      const tagsArray = this.statsClient.tagsMapToArray(finalStatsTags)
      // for some reasons I see in DD untagged metrics, so I want to know when it happens. Once we figure it out we can remove this
      if (!tagsArray.some((t) => t.startsWith('cache_group'))) {
        this.logStep('untagged_caching', { tagsArray, operationTags: this.currentOperation?.tags }, finalStatsTags)
      }
      this.currentOperation?.tags.push(...tagsArray)
    })

    this.logStep('cache_begin', { key }, finalStatsTags)

    if (!this.engageDestinationCache) return createValue()
    const cache = this.engageDestinationCache

    const serializer = options.serializer || DefaultSerializer

    this.logStep('cache_reading', { key }, finalStatsTags)

    const cacheRead = await getOrCatch(() => cache.getByKey(key))
    finalStatsTags.cache_step = `read_${cacheRead.error ? 'error' : !isNone(cacheRead.value) ? 'value' : 'value_empty'}`

    this.logStep(
      'cache_read',
      { key, error: cacheRead.error ? getErrorDetails(cacheRead.error) : undefined, value: cacheRead.value },
      finalStatsTags
    )

    if (cacheRead.error) {
      //redis error
      finalStatsTags.cache_read_error = true
      this.logStep(
        'cache_read_error',
        {
          key,
          error: getErrorDetails(cacheRead.error)
        },
        finalStatsTags
      )
      this.throwRetryableError('Error reading cache')
    }

    // we lock only if cache not found
    if (isNone(cacheRead.value) && options.lockOptions) {
      this.logStep('cache_locking', { key }, finalStatsTags)

      if (!options.lockOptions.cacheGroup) options.lockOptions.cacheGroup = cache_group
      return this.withDistributedLock(
        `cache:${key}`,
        () => this.getOrAddCache(key, createValue, { ...options, lockOptions: undefined }),
        options.lockOptions
      )
    }

    if (!isNone(cacheRead.value)) {
      //if cache FOUND (getByKey returned not null and not undefined)
      // trying to parse the cached value
      const { value: parsedCache, error: parsingError } = getOrCatch(() => serializer.parse(cacheRead.value!))
      finalStatsTags.cache_step = `parse_${
        parsingError ? 'error' : parsedCache !== undefined ? 'value' : 'value_empty'
      }`
      this.logStep('cache_parsed', { key, error: getErrorDetails(parsingError) }, finalStatsTags)

      if (parsingError) {
        //exception happened while parsing the cache.
        // Log it and execute as if we don't have cache
        finalStatsTags.cache_parsing_error = true
        this.logStep(
          'cache_parsing_error',
          { key, value: cacheRead.value, error: getErrorDetails(parsingError) },
          finalStatsTags
        )
      } else if (isNone(parsedCache)) {
        //cache parsed successfully but cache needs to be ignored (e.g. expired) - re-execute
        finalStatsTags.cache_ignored = true
        this.logStep('cache_ignored', { key, value: cacheRead.value }, finalStatsTags)
      } else {
        //parsed cache successfully && cache is not expired
        // parsedValue - either value or error was parsed
        finalStatsTags.cache_hit = true
        finalStatsTags.cached_error = !!parsedCache.error
        this.logStep('cache_hit', { key }, finalStatsTags)
        if (parsedCache.error) {
          this.logStep('cache_hit_error', { key }, finalStatsTags)
          throw parsedCache.error
        }
        this.logStep('cache_hit_value', { key }, finalStatsTags)
        return parsedCache.value
      }
    }
    // re-executing, because cache not found or ignored or failed to read or parse
    finalStatsTags.cache_hit = false
    this.logStep('cache_miss', { key }, finalStatsTags)
    const { value: result, error: resultError } = await getOrCatch(() => createValue())
    finalStatsTags.cache_step = 'createValue_' + (resultError ? 'error' : 'value')
    this.logStep('cache_created_value', { key, resultError: getErrorDetails(resultError) }, finalStatsTags)

    //before returning result - we need to try to serialize it and store it in cache
    const stringified = getOrCatch(() => serializer.stringify(resultError ? { error: resultError } : { value: result }))
    finalStatsTags.cache_step = 'stringify_' + (stringified.error ? 'error' : 'value')
    this.logStep(
      'cache_stringified',
      { key, stringifyError: stringified.error ? getErrorDetails(stringified.error) : undefined },
      finalStatsTags
    )

    if (stringified.error) {
      finalStatsTags.cache_stringify_error = true
      this.logStep('cache_stringify_error', { key, error: stringified.error }, finalStatsTags)
    } else if (!isNone(stringified.value)) {
      //result stringified and contains cacheable value - cache it
      this.logStep('cache_stringify_value', { key, value: stringified.value }, finalStatsTags)
      this.logStep('cache_saving', { key, value: stringified.value }, finalStatsTags)
      const { error: cacheSavingError, value: cacheSavingResult } = await getOrRetry(
        () => cache.setByKey(key, stringified.value!, options.expiryInSeconds),
        options.saveRetry || {
          attempts: 5,
          retryIntervalMs: backoffRetryPolicy(10000, 3)
        }
      )

      finalStatsTags.cache_step = 'save_' + (cacheSavingError ? 'error' : 'value')
      if (cacheSavingError || !cacheSavingResult) {
        options?.onSaveFailed?.(cacheSavingError)

        finalStatsTags.cache_saving_error = cacheSavingError ? true : 'redis_returns_false'
        this.logStep(
          'cache_save_error',
          {
            key,
            error: cacheSavingError ? getErrorDetails(cacheSavingError) : cacheSavingResult
          },
          finalStatsTags
        )
      } else {
        this.logStep('cache_save_success', { key }, finalStatsTags)
      }
    }

    finalStatsTags.cache_step = 'return_' + (resultError ? 'error' : 'value')

    if (resultError) throw resultError
    else return result as T
  }

  /**
   * Distributed lock implementation using Redis
   *
   * LOGIC:
   * Trying to aquire lock. Possible outcomes:
   * 1. Lock acquired:
   *    - createValue() and finally release lock
   * 2. Lock not acquired because of timeout:
   *   - throw timeout error up
   * 3. Lock not acquired because of error accessing redis:
   *   - throw retryable error //fallback to createValue()
   * @param key resource key to lock under
   * @param createValue function to execute if lock is acquired
   * @param options lock options
   * @returns
   */
  @track()
  async withDistributedLock<T>(key: string, createValue: () => Promise<T>, options: LockOptions): Promise<T> {
    const cache_group = options.cacheGroup || this.currentOperation?.parent?.func.name || ''
    const statsTags: StatsTagsMap = { cache_group }
    this.currentOperation?.onFinally.push(() => {
      this.currentOperation?.tags.push(...this.statsClient.tagsMapToArray(statsTags))
    })

    if (!this.engageDestinationCache) {
      return await createValue()
    }
    const cache = this.engageDestinationCache

    const lockKey = `lock:${key}`
    const acquireLock = async () => {
      //tries to acquire lock for acquireLockMaxWaitInSeconds seconds
      statsTags.lock_acquired = false
      this.logStep('cache_lock_acquiring', { key }, statsTags)
      const startTime = Date.now()
      while (Date.now() - startTime < options.acquireLockMaxWaitTimeMs) {
        this.logStep('cache_lock_attempt', { key }, statsTags)
        if (await cache.setByKeyNX(lockKey, 'locked', options.lockMaxTimeMs / 1000)) {
          // lock acquired, returning release function
          statsTags.lock_acquired = true
          this.logStep('cache_lock_acquired', { key }, statsTags)
          this.statsHistogram('lock_acquire_time', Date.now() - startTime, statsTags)
          return {
            release: async () => {
              this.logStep('cache_lock_releasing', { key }, statsTags)
              const releaseRes = await cache.delByKey(lockKey)
              this.logStep('cache_lock_released', { key, releaseRes }, statsTags)
            }
          }
        }
        this.logStep('cache_lock_waiting', { key, lockKey }, statsTags)
        await new Promise((resolve) => setTimeout(resolve, options.acquireLockRetryIntervalMs || 500)) // Wait 500ms before retrying
      }
      //no lock acquired because of waiting timeout
      this.logStep('cache_lock_timeout', { key, lockKey }, statsTags)
    }

    const { value: lock, error: redisError } = await getOrCatch(() => acquireLock())

    if (redisError) {
      statsTags.lock_acquired_error = true
      this.logStep('cache_lock_error', { key, error: getErrorDetails(redisError) }, statsTags)
      this.throwRetryableError('Error acquiring lock: ' + redisError.message)
    } else if (!lock?.release) {
      // no redis error and no lock acquired - means it was acquiring timeout
      this.logStep('cache_lock_timeout_exit', { key }, statsTags)
      this.throwRetryableError('Timeout while acquiring lock')
    }
    //if lock obtained or there was redis error - execute createValue and finally release lock
    else
      try {
        this.logStep('cache_lock_creating', { key }, statsTags)
        return await createValue()
      } finally {
        const { error: releaseError } = await getOrCatch(() => lock.release())
        if (releaseError) {
          statsTags.lock_release_error = true
          this.logStep('lock_release_error', { key, error: getErrorDetails(releaseError) }, statsTags)
          // we can ignore the error, as the lock will be expired anyway
        }
      }
  }

  logStep(stepName: string, logDetails: any, statsTags: StatsTagsMap) {
    statsTags.step = stepName
    this.logInfo(stepName, { ...logDetails, statsTags })
    this.statsIncr(stepName, 1, statsTags)
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
        cacheObj = { error: errorDetails }
      }
    } else if (valueOrError.value !== undefined) {
      cacheObj = { value: valueOrError.value }
    }
    return cacheObj ? JSON.stringify(cacheObj) : undefined
  },

  parse: (cachedValue) => {
    const parsed = JSON.parse(cachedValue) as { value?: any; error?: ErrorDetails }
    if (parsed.error) {
      const error = new IntegrationError(parsed.error.message, parsed.error.code, parsed.error.status || 400)
      error.retry = false
      return { error }
    } else {
      return { value: parsed.value }
    }
  }
}

export type LockOptions = {
  /**
   * Max time in milliseconds to wait for the lock to be acquired.
   * If the lock is not acquired within this time, the timeout error will be thrown
   */
  acquireLockMaxWaitTimeMs: number
  /**
   * Interval in milliseconds between lock acquisition attempts
   */
  acquireLockRetryIntervalMs?: number
  /**
   * Max time in milliseconds for which the lock will be held.
   * If the lock is not released within this time, it will be expired.
   */
  lockMaxTimeMs: number
  /**
   * used for stats
   */
  cacheGroup?: string
}

export function isNone(cacheValue: any): cacheValue is null | undefined | void {
  return cacheValue === undefined || cacheValue === null
}
