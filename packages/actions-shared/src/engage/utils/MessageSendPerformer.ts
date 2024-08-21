/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EngageActionPerformer } from './EngageActionPerformer'
import { isRetryableError } from './isRetryableError'
import { AggregateError } from './AggregateError'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { getProfileApiEndpoint, Region } from './getProfileApiEndpoint'
import { track } from './track'
import { IntegrationError, ModifiedResponse, PayloadValidationError } from '@segment/actions-core'
import { getErrorDetails } from '.'
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
    const messageId = (this.executeInput as any)['rawData']?.messageId
    const recipientId = recepient.id
    return await this.getOrAddCache(
      `${messageId}-${recipientId?.toLowerCase()}`,
      () => this.sendToRecepient(recepient),
      {
        parse: (cachedValue) => {
          const parsed = CachedValueFactory.fromString(cachedValue)
          if (parsed instanceof CachedError) {
            const error = new IntegrationError(parsed.message, parsed.code, parsed.status)
            error.retry = false
            return { error }
          } else if (parsed.type === CachedResponseType.Success) {
            return { value: { status: parsed.status } as ModifiedResponse<unknown> }
          }
        },
        stringify: (cacheable) => {
          if (!messageId || !recipientId) return // if messageId or recipientId is not available, then don't cache
          if (cacheable.error && !isRetryableError(cacheable.error)) {
            const errorDetails = getErrorDetails(cacheable.error)
            if (errorDetails?.status) {
              return new CachedError(errorDetails.status, errorDetails.message, errorDetails.code).serialize()
            }
          } else if (cacheable.value) {
            return new CachedValue(cacheable.value.status).serialize()
          }
        }
      }
    )
  }

  async getOrAddCache<T>(
    key: string,
    createValue: () => Promise<T>,
    serializer: {
      //if undefined returned, then the value will not be cached
      stringify: (cacheable: ValueOrError<T>) => string | void | undefined
      //if undefined returned, then the cache is either corrupted or expired and will be re-executed
      parse: (cachedValue: string) => ValueOrError<T> | void | undefined
    }
  ): Promise<T> {
    if (!this.engageDestinationCache) return createValue()

    const cache = await getOrCatch(() => this.engageDestinationCache!.getByKey(key))
    const cachedValue = cache.value
    if (cachedValue) {
      const { value: parsed, error: parsingError } = getOrCatch(() => serializer.parse(cachedValue))

      if (parsingError) {
        //exception happened while parsing the cache.
        // Log it and execute as if we don't have cache
        this.logError('Error parsing cache', { key, cachedValue, parsingError })
        this.statsIncr('cache_parsing_error')
      } else {
        //parsed successfully - either value or error was cached
        this.statsIncr('cache_hit', 1, [`cached_error:${!!parsed?.error}`])
        if (parsed?.value) {
          return parsed.value
        } else if (parsed?.error) {
          throw parsed.error
        }
      }
    }

    this.statsIncr('cache_miss')
    this.logInfo('Cache miss', { key })
    const { value: result, error: resultError } = await getOrCatch(() => createValue())
    const stringified = getOrCatch(() => serializer.stringify(resultError ? { error: resultError } : { value: result }))
    if (stringified?.error) {
      this.logError('Error serializing cache value', { key, error: stringified.error })
      this.statsIncr('cache_serialization_error')
    } else if (stringified?.value) {
      //value is serializable - cache it
      const { error: cacheSavingError } = await getOrCatch(() =>
        this.engageDestinationCache!.setByKey(key, stringified.value!)
      )
      if (cacheSavingError) {
        this.logError('Error saving cache', { key, error: cacheSavingError })
        this.statsIncr('cache_saving_error')
      }
    }

    if (resultError) throw resultError
    else return result as T
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
    const correlation_id = payload.customArgs?.correlation_id || payload.customArgs?.__segment_internal_correlation_id__
    if (correlation_id) res.push(`correlation_id:${correlation_id}`)

    const computation_id = (payload as any).segmentComputationId
    if (computation_id) res.push(`computation_id:${computation_id}`)

    return res
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

function getOrCatch<T>(
  getValue: () => T
): T extends Promise<any> ? Promise<ValueOrError<Awaited<T>>> : ValueOrError<T> {
  try {
    const value = getValue()

    if (value instanceof Promise) {
      return value.then((value) => ({ value })).catch((error) => ({ error })) as any
    } else {
      return { value } as any
    }
  } catch (error) {
    return { error } as any
  }
}
