/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EngageActionPerformer } from './EngageActionPerformer'
import { isRetryableError } from './isRetryableError'
import { AggregateError } from './AggregateError'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { getProfileApiEndpoint, Region } from './getProfileApiEndpoint'
import { track } from './track'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { getErrorDetails } from './ResponseError'
import { StatsTagsMap } from './operationTracking'
import { CachedError, CachedResponseType, CachedValue, CachedValueFactory } from './CachedResponse'

export enum SendabilityStatus {
  /**
   * No. of externalIds for which the message send is triggered based on the customer chosen send type (bypass, opt-out, opt-in)
   */
  ShouldSend = 'should_send',
  /**
   * No. of externalIds for which the message send is not triggered based on the customer chosen send type (bypass, opt-out, opt-in)
   */
  NotSubscribed = 'not_subscribed',
  /**
   * This is set if there are no supported ids for this channel in the payload
   */
  NoSupportedExternalIds = 'no_supported_ids',
  /**
   * No. of externalIds that have iSubscribed field missing from PSS (This should never happen as PSS always return either true, false or null)
   */
  InvalidSubscriptionStatus = 'invalid_subscription_status',
  /**
   * This is set if 'send' is false in the payload.
   */
  SendDisabled = 'send_disabled'
}

export interface MessagePayloadBase {
  sendBasedOnOptOut?: boolean
  send?: boolean
  userId?: string
  customArgs?: {
    [k: string]: unknown
  }
  externalIds?: {
    /**
     * A unique identifier for the collection.
     */
    id?: string
    /**
     * The external ID contact type.
     */
    type?: string
    /**
     * The external ID contact channel type (SMS, WHATSAPP, etc).
     */
    channelType?: string
    /**
     * The subscription status for the identity.
     */
    subscriptionStatus?: string
  }[]

  traitEnrichment?: boolean
  traits?: {
    [k: string]: unknown
  }
}

export interface MessageSettingsBase {
  region?: string
  sourceId?: string
  spaceId?: string
  profileApiEnvironment: string
  profileApiAccessToken: string
}

export type ExtId<TPayload extends MessagePayloadBase> = NonNullable<TPayload['externalIds']>[number]

export interface SendabilityPayload<TPayload extends MessagePayloadBase> {
  sendabilityStatus: SendabilityStatus | string
  recepients?: ExtId<TPayload>[]
  invalid?: ExtId<TPayload>[]
}

export type RecepientSendResult<TPayload extends MessagePayloadBase, TResult = any> = {
  recepient: ExtId<TPayload>
  status: 'fulfilled' | 'rejected'
  result?: TResult
  error?: any
}

export abstract class MessageSendPerformer<
  TSettings extends MessageSettingsBase,
  TPayload extends MessagePayloadBase
> extends EngageActionPerformer<TSettings, TPayload> {
  @track()
  /**
   * Internal function to process sending a recepient.
   *
   * If a cache exists, it will check to see if the messageId, and recipientId
   * has already been attempted. The response will be stored if the error
   * returned from the server is a non retryable error or if the response is
   * successful.
   *
   * @param recepient The recepient to process.
   * @returns The response from the server.
   */
  protected async sendToRecepientCache(recepient: ExtId<TPayload>) {
    const messageId = this.getMessageId()
    const recipientId = recepient.id
    // if messageId or recipientId is not available, then don't cache
    if (!messageId || !recipientId) return this.sendToRecepient(recepient)

    return await this.getOrAddCache(
      `${messageId}-${recipientId?.toLowerCase()}`,
      () => this.sendToRecepient(recepient),
      {
        cacheGroup: 'sendToRecepient',
        lockOptions: {
          acquireLockMaxWaitInSeconds: 30, //30 secs - max wait for lock time
          acquireLockRetryIntervalMs: 1000, //1 sec
          lockTTLInSeconds: 3 * 60 //3 mins max lock time
        }
      }
    )
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
      lockOptions?: Parameters<typeof MessageSendPerformer.prototype.withDistributedLock>[2]
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
      acquireLockMaxWaitInSeconds: number
      acquireLockRetryIntervalMs?: number
      lockTTLInSeconds: number
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
      return createValue()
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
      while (Date.now() - startTime < options.acquireLockMaxWaitInSeconds * 1000) {
        if ((await redisClient.set(lockKey, 'locked', 'NX', 'PX', options.lockTTLInSeconds * 1000)) === 'OK') {
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
        return createValue()
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

  async doPerform() {
    // sending messages and collecting results, including exceptions
    const res = this.forAllRecepients(this.sendToRecepientCache.bind(this))

    if (this.executeInput.features) {
      this.logInfo('Feature flags:' + JSON.stringify(this.executeInput.features))
    }

    // only if it succeeded, we can send stats
    this.statsEventDeliveryTs()
    return res
  }

  /**
   * check if the externalId object is supported for sending a message by current class of message sender
   * @param externalId
   * @returns
   */
  abstract isSupportedExternalId(externalId: NonNullable<TPayload['externalIds']>[number]): boolean

  static readonly nonSendableStatuses = ['unsubscribed', 'false']
  static readonly sendableStatuses = ['subscribed', 'true']

  /**
   * allows access to static members of the current class that can be overriden in subclasses
   */
  getStaticMembersOfThisClass<
    ThisStaticClass extends typeof MessageSendPerformer = typeof MessageSendPerformer
  >(): ThisStaticClass {
    return this.constructor as ThisStaticClass
  }

  /**
   * check if extId is (un)subscribed (returns true|false) or if subscription status is invalid (returns undefined)
   */
  isExternalIdSubscribed(extId: ExtId<TPayload>): boolean | undefined {
    const staticMems = this.getStaticMembersOfThisClass()
    const subStatus = extId.subscriptionStatus?.toString()?.toLowerCase()

    // isOptOutModel if true means we can target to any statuses apart from unsubscribed
    const isOptOutModel = this.payload.sendBasedOnOptOut ? true : false
    if (!subStatus) return isOptOutModel
    if (staticMems.sendableStatuses.includes(subStatus)) return true
    if (staticMems.nonSendableStatuses.includes(subStatus)) return false
    return undefined //Invalid subscriptionStatus
  }

  // These are used for tags in datadog for Subscription Team
  convertSubscriptionStatusText(subVal: string | undefined): string {
    if (subVal == undefined) {
      return 'unknown'
    }
    if (subVal == '') {
      return 'did_not_subscribe'
    }
    return subVal
  }
  /**
   * Gets all sendable recepients for the current payload or a reason why it is not sendable
   * @returns
   */
  getSendabilityPayload(): SendabilityPayload<TPayload> {
    if (!this.payload.send) {
      return { sendabilityStatus: SendabilityStatus.SendDisabled }
    }

    // list of extenalIds that are supported by this Channel, if none - exit based on customer chosen send type (bypass, opt-out, opt-in)
    const supportedExtIdsWithSub = this.payload.externalIds
      ?.filter((extId) => this.isSupportedExternalId(extId))
      .map((extId) => ({
        extId,
        isSubscribed: this.isExternalIdSubscribed(extId)
      }))

    this.payload.sendBasedOnOptOut
      ? this.currentOperation?.tags.push('SubscriptionOptOutType:' + true)
      : this.currentOperation?.tags.push('SubscriptionOptOutType:' + false)

    if (!supportedExtIdsWithSub || !supportedExtIdsWithSub.length)
      return {
        sendabilityStatus: SendabilityStatus.NoSupportedExternalIds
      }

    this.currentOperation?.tags.push(
      'subscription_status:' + this.convertSubscriptionStatusText(supportedExtIdsWithSub[0]?.extId?.subscriptionStatus)
    )
    const invalidSubStatuses = supportedExtIdsWithSub.filter((e) => e.isSubscribed === undefined).map((e) => e.extId)

    const shouldSendExtIds = supportedExtIdsWithSub.filter((e) => e.isSubscribed === true).map((e) => e.extId)

    if (!shouldSendExtIds.length) {
      return invalidSubStatuses.length == 0
        ? {
            sendabilityStatus: SendabilityStatus.NotSubscribed
          }
        : {
            sendabilityStatus: SendabilityStatus.InvalidSubscriptionStatus,
            invalid: invalidSubStatuses
          }
    }

    // if have subscribed, then return them IF they have id values (e.g. phone numbers)
    if (shouldSendExtIds.length) {
      // making sure subscribed have id value
      const subWithIds = shouldSendExtIds.filter((extId) => extId.id)
      return {
        sendabilityStatus:
          subWithIds.length > 0 ? SendabilityStatus.ShouldSend : SendabilityStatus.NoSupportedExternalIds,
        recepients: subWithIds.length > 0 ? subWithIds : shouldSendExtIds,
        invalid: invalidSubStatuses
      }
    }

    //only if there was no subscribed found, then we report invalid sub statuses
    if (invalidSubStatuses.length)
      return {
        sendabilityStatus: SendabilityStatus.InvalidSubscriptionStatus,
        invalid: invalidSubStatuses
      }

    // should not get here, but if we did - return no phones
    return {
      sendabilityStatus: SendabilityStatus.NoSupportedExternalIds,
      recepients: supportedExtIdsWithSub.map((e) => e.extId)
    }
  }

  getRecepients(): ExtId<TPayload>[] {
    const sendabilityPayload = this.getSendabilityPayload()
    const shouldSend = sendabilityPayload.sendabilityStatus === SendabilityStatus.ShouldSend

    this.currentOperation?.tags.push('sendability_status:' + sendabilityPayload.sendabilityStatus)
    this.currentOperation?.logs.push(
      shouldSend
        ? `Sending message to recepients (${sendabilityPayload.recepients?.length}): ${sendabilityPayload.recepients
            ?.map((r) => this.redactPii(r.id))
            .join(', ')}})`
        : `Not sending message because ${sendabilityPayload.sendabilityStatus?.toUpperCase()}. Recepients (${
            sendabilityPayload.recepients?.length
          })`
    )

    return sendabilityPayload.sendabilityStatus == SendabilityStatus.ShouldSend
      ? sendabilityPayload.recepients || []
      : []
  }

  /**
   * Send message to recipient.
   *
   * @param recepient The recipient to send the message to.
   * @returns The response from the server.
   */
  abstract sendToRecepient(recepient: ExtId<TPayload>): Promise<any>

  getCommonTags() {
    const settings = this.settings
    const payload = this.payload // as Record<string, any>
    const res = [
      `space_id:${settings.spaceId}`,
      `projectid:${settings.sourceId}`,
      `settings_region:${settings.region}`,
      `channel:${this.getChannelType()}`
    ]
    const correlation_id = this.getCorrelationId()
    if (correlation_id) res.push(`correlation_id:${correlation_id}`)

    const computation_id = (payload as any).segmentComputationId
    if (computation_id) res.push(`computation_id:${computation_id}`)

    return res
  }
  getCorrelationId() {
    return this.payload.customArgs?.correlation_id || this.payload.customArgs?.__segment_internal_correlation_id__
  }
  getMessageId() {
    return (this.executeInput as any)['rawData']?.messageId
  }

  /**
   * populate the logDetails object with the data that should be logged for every message
   */
  beforePerform() {
    super.beforePerform?.()

    //adding common tags to the the tags that will be added to every single metric added via this.stats*
    if (this.executeInput.statsContext)
      this.executeInput.statsContext.tags = this.statsClient.mergeTags(
        this.executeInput.statsContext.tags,
        this.getCommonTags()
      )

    if (!this.settings.region && this.getDefaultSettingsRegion) {
      this.settings.region = this.getDefaultSettingsRegion()
    }
    //overrideable
    Object.assign(this.logDetails, {
      externalIds: this.payload.externalIds?.map((eid) => ({ ...eid, id: this.redactPii(eid.id) })),
      shouldSend: this.payload.send,
      settings_region: this.settings.region,
      sourceId: this.settings.sourceId,
      spaceId: this.settings.spaceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageId: (this.executeInput as any)['rawData']?.messageId, // undocumented, not recommended way used here for tracing retries in logs https://github.com/segmentio/action-destinations/blob/main/packages/core/src/destination-kit/action.ts#L141
      channelType: this.getChannelType()
    })
    if ('userId' in this.payload) this.logDetails.userId = this.payload.userId

    // grab the delivery attempt and replay from statsContext
    if (this.executeInput.statsContext?.tags) {
      for (const item of this.executeInput.statsContext?.tags) {
        if (item.includes('delivery_attempt') || item.includes('replay')) {
          this.logDetails[item.split(':')[0]] = item.split(':')[1]
        }
      }
    }
  }

  /**
   * used to set settings.region if it's undefined
   */
  getDefaultSettingsRegion?(): string

  statsEventDeliveryTs(): void {
    const eventOccurredTS = (this.payload as any)?.eventOccurredTS
    if (typeof eventOccurredTS === 'number') {
      this.statsHistogram('eventDeliveryTS', Date.now() - new Date(eventOccurredTS).getTime())
    }
  }

  beforeSend?(recepients: ExtId<TPayload>[]): MaybePromise<void>

  async forAllRecepients<TResult = any>(
    sendToRecepient: (recepient: ExtId<TPayload>) => TResult
  ): Promise<RecepientSendResult<TPayload, TResult>[]> {
    const recepients = this.getRecepients()

    await this.beforeSend?.(recepients)

    const results = (await Promise.allSettled(recepients.map((recepient) => sendToRecepient(recepient)))).map(
      (r, i) =>
        <RecepientSendResult<TPayload>>{
          recepient: recepients[i],
          status: r.status,
          ...(r.status === 'rejected' ? { error: r.reason } : { result: r.value })
        }
    )

    // transforming send results to a single result or throwing single exception
    return this.aggregateSendResults(results)
  }

  aggregateSendResults(sendResults: RecepientSendResult<TPayload>[]): any {
    //if empty sendResult - return nothing
    if (!sendResults.length) {
      return
    }

    // if only one result - return as is or throw as is
    if (sendResults.length === 1) {
      const sendResult = sendResults[0]
      if (sendResult.status === 'rejected') {
        throw sendResult.error
      } else {
        return sendResult.result
      }
    }

    // if we are here, then all failed.
    const rejected = sendResults.filter((sr) => sr.status === 'rejected')

    /*
     * Get all of retryable errors and aggregate them.
     * return
     */
    // if some errors are retriable, throw aggregated with first code and status
    if (rejected.length) {
      const firstRetryableError = rejected.find((r) => isRetryableError(r.error))?.error
      throw AggregateError.create({
        errors: rejected.map((r) => r.error),
        takeCodeAndStatusFromError: firstRetryableError,
        message: (msg) =>
          `Failed to send to all subscribed recepients (${firstRetryableError ? 'retryable' : 'not-retryable'}):` + msg
      })
    }

    return sendResults.map((sr) => sr.result)
  }

  @track()
  async getProfileTraits(): Promise<Record<string, string>> {
    if (this.payload.traitEnrichment) return this.payload?.traits || ({} as any)

    if (!this.payload.userId) {
      throw new PayloadValidationError('No userId provided and no traits provided')
    }

    const endpoint = getProfileApiEndpoint(this.settings.profileApiEnvironment, this.settings.region as Region)
    const encodedProfileId = encodeURIComponent(this.payload.userId)
    const response = await this.request(
      `${endpoint}/v1/spaces/${this.settings.spaceId}/collections/users/profiles/user_id:${encodedProfileId}/traits?limit=200`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(this.settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    const body = await response.json()
    return body.traits
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

type CacheSerializer<T> = {
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

const DefaultSerializer: CacheSerializer<any> = {
  parse: (cachedValue) => {
    const parsed = CachedValueFactory.fromString(cachedValue)
    if (parsed instanceof CachedError) {
      const error = new IntegrationError(parsed.message, parsed.code, parsed.status)
      error.retry = false
      return { error }
    } else if (parsed.type === CachedResponseType.Success) {
      return { value: { status: parsed.status } }
    }
  },
  stringify: (cacheable) => {
    if (cacheable.error && !isRetryableError(cacheable.error)) {
      // we only stringify non-retryable error, retryable errors are not cached
      const errorDetails = getErrorDetails(cacheable.error)
      if (errorDetails?.status) {
        return new CachedError(errorDetails.status, errorDetails.message, errorDetails.code).serialize()
      }
    } else if (cacheable.value) {
      return new CachedValue(cacheable.value.status).serialize()
    }
  }
}
