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
import { Awaited, OperationDecorator, StatsTags, TryCatchFinallyContext } from './operationTracking'
import truncate from 'lodash/truncate'
import { isRetryableError } from './isRetryableError'
import { getOrCatch, ValueOrError } from './getOrCatch'
import { backoffRetryPolicy, getOrRetry, GetOrRetryArgs } from './getOrRetry'

/**
 * Base class for all Engage Action Performers. Supplies common functionality like logger, stats, request, operation tracking
 */
export abstract class EngageActionPerformer<TSettings = any, TPayload = any, TReturn = any> {
  readonly logger: EngageLogger
  readonly statsClient: EngageStats
  readonly engageDestinationCache?: EngageDestinationCache
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
          errorDetails?.code?.toLowerCase().includes('etimedout')

        // CHANNELS-651 somehow Timeouts are not retried by Integrations, this is fixing it
        if (isTimeoutError) {
          const status = errorDetails?.status ?? respError.status ?? 408
          respError.status = status
          if (errorDetails) errorDetails.status = status

          const errorCode = errorDetails?.code ?? respError.code ?? 'etimedout'
          respError.code = errorCode
          if (errorDetails) errorDetails.code = errorCode
          respError.retry = true
        }

        if (errorDetails?.code) op.tags.push(`response_code:${errorDetails.code}`)
        if (errorDetails?.status) op.tags.push(`response_status:${errorDetails.status}`)
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
    return await this.requestClient<Data>(url, {
      timeout: this.isRequestTimeoutExtended() ? 60_000 * 5 : 30_000,
      ...options
    })
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
  logWarn(msg: string, metadata?: object) {
    this.logger.logWarn(msg, metadata)
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

  createStepLogger(args: LogStepDetails): StepLogger {
    const { tags = {}, logs = {} } = args
    const messageId = (this.executeInput as any)['rawData']?.messageId
    logs.messageId = messageId
    const operation =
      OperationDecorator.getOperationName(this.currentOperation as TryCatchFinallyContext) ||
      this.currentOperation?.func.name ||
      ''

    const appendStepDetails = (stepname: string, details?: Partial<LogStepDetails>) => {
      tags['step_' + stepname] = true
      if (details?.tags) {
        for (const [key, value] of Object.entries(details.tags)) tags[stepname + '_' + key] = value
      }
      if (details?.logs) {
        for (const [key, value] of Object.entries(details.logs))
          logs[stepname + '_' + key] = value instanceof Error ? getErrorDetails(value) : value
      }
    }

    const write = (stepName: string, details?: LogStepDetails, durationMs?: number) => {
      appendStepDetails(stepName, details)
      tags.last_step = stepName
      this.statsIncr(`${operation}_${stepName}`, 1, tags)
      const hasError = !!(details?.tags?.error || details?.logs?.error)
      const level: LogStepDetails['level'] = details?.level ? details.level : hasError ? 'warn' : 'info'
      switch (level) {
        case 'error':
          this.logError(`${operation}_${stepName}`, logs)
          break
        case 'warn':
          this.logWarn(`${operation}_${stepName}`, logs)
          break
        default:
          this.logInfo(`${operation}_${stepName}`, logs)
          break
      }
      if (durationMs !== undefined) {
        this.statsHistogram(`${operation}_${stepName}.duration`, durationMs, tags)
      }
    }

    const track: StepLogger['track'] = (stepName, fn) => {
      const startStep = `${stepName}_starting`
      write(startStep)
      const stepDetails: LogStepDetails = { logs: {}, tags: {} }
      let fnRes: Awaited<ReturnType<typeof fn>> | undefined = undefined
      let error: any = undefined
      let isPromise = false
      const startTime = Date.now()
      const onFinally = () => {
        const durationMs = Date.now() - startTime
        const valueOrError: ValueOrError<any> | undefined =
          fnRes instanceof Object && ('error' in fnRes || 'value' in fnRes) ? (fnRes as ValueOrError<any>) : undefined
        if (valueOrError) fnRes = valueOrError.value
        error = error || valueOrError?.error
        stepDetails.tags.error = !!error
        if (error) {
          stepDetails.logs.error = error ? getErrorDetails(error) : undefined
        } else {
          const valueStr = getOrCatch(() =>
            (isNone(fnRes) ? '(none)' : fnRes instanceof Object ? JSON.stringify(fnRes) : `${fnRes}`).substring(0, 100)
          )
          stepDetails.logs.value = valueStr.error ? `<error> ${valueStr.error.message}` : `${valueStr.value}`
        }
        write(`${stepName}_finished`, stepDetails, durationMs)
      }
      const onCatch = (e: any) => {
        error = e
        throw e
      }
      try {
        const result = fn(stepDetails)

        if (result instanceof Promise) {
          isPromise = true
          return result
            .then((res) => {
              return (fnRes = res)
            })
            .catch(onCatch)
            .finally(onFinally) as any
        }
        return result
      } catch (e) {
        onCatch(e)
      } finally {
        if (!isPromise) {
          onFinally()
        }
      }
    }
    this.currentOperation?.onFinally.push(() => {
      const tagsArray = this.statsClient.tagsMapToArray(tags)
      this.currentOperation?.tags.push(...tagsArray)
    })

    return {
      logs,
      tags,
      track,
      write
    }
  }

  /**
   * tries to get value in cache and if it cannot find it - it adds it to cache
   * @param key
   * @param createValue method to compute value if it is not found in cache
   * @param options cache options
   * @returns value from cache or computed value
   */
  @track()
  async getOrAddCache<T>(
    key: string,
    createValue: () => Promise<T>,
    options: {
      /**
       * The group of cache used for stats tags
       */
      cacheGroup?: string
      /**
       * convert value to string and back
       */
      serializer?: CacheSerializer<T>
      /**
       * cache expiry in seconds
       */
      expiryInSeconds?: number
      /**
       * distributed lock options to be used while creating cache
       */
      lockOptions?: LockOptions
      /**
       * retry options for saving cache
       */
      saveRetry?: GetOrRetryArgs
      /**
       * callback invoked when cache save failed
       */
      onSaveFailed?: (error: Error) => void
    }
  ): Promise<T> {
    const cache_group = options.cacheGroup || this.currentOperation?.parent?.func.name || ''

    const step = this.createStepLogger({
      tags: {
        cache_group: cache_group,
        withLock: !!options.lockOptions,
        last_step: 'init'
      },
      logs: { key }
    })

    if (!this.engageDestinationCache) return step.track('no_cache', () => createValue())
    const cache = this.engageDestinationCache

    const serializer = options.serializer || DefaultSerializer

    const cacheRead = await step.track('cache_reading', () => getOrCatch(() => cache.getByKey(key)))

    if (cacheRead.error) {
      //redis error
      this.throwRetryableError('Error reading cache: ' + cacheRead.error.message)
    }

    // we lock only if cache not found
    if (isNone(cacheRead.value) && options.lockOptions) {
      if (!options.lockOptions.cacheGroup) options.lockOptions.cacheGroup = cache_group
      return step.track('cache_locking', () =>
        this.withDistributedLock(
          `cache:${key}`,
          () => this.getOrAddCache(key, createValue, { ...options, lockOptions: undefined }),
          options.lockOptions!
        )
      )
    }

    if (!isNone(cacheRead.value)) {
      //if cache FOUND (getByKey returned not null and not undefined)
      // trying to parse the cached value
      const { value: parsedCache, error: parsingError } = step.track('cache_parse', () =>
        getOrCatch(() => serializer.parse(cacheRead.value!))
      )

      if (!parsingError)
        if (isNone(parsedCache)) {
          //cache parsed successfully but cache needs to be ignored (e.g. expired) - re-execute
          step.write('cache_ignored')
        } else {
          //parsed cache successfully && cache is not expired
          // parsedValue - either value or error was parsed
          step.write('cache_hit', { tags: { cache_hit: true, cached_error: !!parsedCache.error } })
          if (parsedCache.error) {
            throw parsedCache.error
          }
          return parsedCache.value
        }
    }
    // re-executing, because cache not found or ignored or failed to read or parse
    step.write('cache_miss')
    const { value: result, error: resultError } = await step.track('cache_create_value', () =>
      getOrCatch(() => createValue())
    )

    //before returning result - we need to try to serialize it and store it in cache
    const stringified = step.track('cache_stringified', () =>
      getOrCatch(() => serializer.stringify(resultError ? { error: resultError } : { value: result }))
    )

    if (!stringified.error)
      if (!isNone(stringified.value)) {
        //result stringified and contains cacheable value - cache it
        const { error: cacheSavingError, value: cacheSavingResult } = await step.track('cache_save', () =>
          getOrRetry(
            () => cache.setByKey(key, stringified.value!, options.expiryInSeconds),
            options.saveRetry || {
              attempts: 5,
              retryIntervalMs: backoffRetryPolicy(10000, 3),
              onFailedAttempt: (error, attemptCount) => {
                step.write('cache_save_failed_attempt', { logs: { attemptCount, error: getErrorDetails(error) } })
              }
            }
          )
        )

        if (cacheSavingError || !cacheSavingResult) {
          options?.onSaveFailed?.(cacheSavingError)
        }
      } else {
        step.write('cache_save_skipped')
      }

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
    const step = this.createStepLogger({
      logs: {
        key
      },
      tags: {
        cache_group
      }
    })

    if (!this.engageDestinationCache) {
      return await createValue()
    }
    const cache = this.engageDestinationCache

    const lockKey = `lock:${key}`
    const acquireLock = async () => {
      //tries to acquire lock for acquireLockMaxWaitInSeconds seconds
      const startTime = Date.now()
      while (Date.now() - startTime < options.acquireLockMaxWaitTimeMs) {
        step.write('cache_lock_attempt')
        if (await step.track('redis_setNX', () => cache.setByKeyNX(lockKey, 'locked', options.lockMaxTimeMs / 1000))) {
          // lock acquired, returning release function
          step.write('cache_lock_acquired', { tags: { lock_acquired: true } })
          this.statsHistogram('cache_lock_waiting_time', Date.now() - startTime, step.tags)
          return {
            release: () => step.track('redis_delByKey', () => cache.delByKey(lockKey))
          }
        }
        step.write('cache_lock_waiting')
        await new Promise((resolve) => setTimeout(resolve, options.acquireLockRetryIntervalMs || 500)) // Wait 500ms before retrying
      }
      //no lock acquired because of waiting timeout
      step.write('cache_lock_timeout')
    }

    const { value: lock, error: redisError } = await step.track('cache_acquire_lock', () =>
      getOrCatch(() => acquireLock())
    )

    if (redisError) {
      this.throwRetryableError('Error acquiring lock: ' + redisError.message)
    } else if (!lock?.release) {
      // no redis error and no lock acquired - means it was acquiring timeout
      step.write('cache_lock_timeout_exit')
      this.throwRetryableError('Timeout while acquiring lock')
    } else {
      //if lock obtained - execute createValue and finally release lock
      const { value: createdValue, error: createValueError } = await step.track('cache_lock_create', () =>
        getOrCatch(() => createValue())
      )

      //release the lock
      await step.track('cache_lock_release', () => getOrCatch(() => lock.release()))
      if (createValueError) throw createValueError
      return createdValue as T
    }
  }

  isLockExpirationExtended() {
    return this.isFeatureActive('engage-messaging-lock-expiration-extended', () => false)
  }
  isRequestTimeoutExtended() {
    return this.isFeatureActive('engage-messaging-request-timeout-extended', () => false)
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

/**
 * Similar to `@track` decorator, but it is used for tracking steps within the operation.
 * Ideally should be integrated with `@track` decorator later
 * This was created for thorough troubleshooting of the operations
 */
type StepLogger = LogStepDetails & {
  /**
   * Track inline function execution within trackable operation
   * 1) Write a log message and increment stats before executing the function
   * 2) executes the function and captures the result or error
   * 3) Write a log message, increment stats finishing step, add histogram of step duration, with info if it was success or error
   * The log messages and stats metric names will be prefixed with the step name
   * @param stepName
   * @param fn
   */
  track<T>(stepName: string, fn: (details: LogStepDetails) => T): T
  /**
   * Write a log message for the current step and increment the stats metric for the step
   * @param stepName name of the step
   * @param details log details and stats tags
   */
  write(stepName: string, details?: Partial<LogStepDetails>): void
}

/**
 * details for logging and stats tracking of the step
 */
type LogStepDetails = {
  tags: Record<string, any>
  logs: Record<string, any>
  level?: 'info' | 'warn' | 'error'
}
