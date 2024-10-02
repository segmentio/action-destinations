/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheSerializer, EngageActionPerformer } from './EngageActionPerformer'
import { isRetryableError } from './isRetryableError'
import { AggregateError } from './AggregateError'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { getProfileApiEndpoint, Region } from './getProfileApiEndpoint'
import { track } from './track'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { getErrorDetails } from './ResponseError'
import { ValueOrError } from './getOrCatch'

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
  segmentComputationId?: string
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
        expiryInSeconds: 60 * 60 * 4, // 4 hours
        cacheGroup: 'sendToRecepient',
        lockOptions: {
          acquireLockMaxWaitTimeMs: 30 * 1000, //30 secs - max wait for lock time, before throwing timeout error
          acquireLockRetryIntervalMs: 1000, //1 sec
          lockMaxTimeMs: (this.isLockExpirationExtended() ? 30 : 10) * 60_000 //30 or 10 mins max lock time
        },
        serializer: SendToRecepientResponseSerializer
      }
    )
  }

  async doPerform() {
    // sending messages and collecting results, including exceptions

    const res = this.forAllRecepients(
      this.isFeatureActive('engage-cache-send-message')
        ? this.sendToRecepientCache.bind(this)
        : this.sendToRecepient.bind(this)
    )

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
    const payload = this.payload
    const res = [
      `space_id:${settings.spaceId}`,
      `projectid:${settings.sourceId}`,
      `settings_region:${settings.region}`,
      `channel:${this.getChannelType()}`
    ]
    const correlation_id = this.getCorrelationId()
    if (correlation_id) res.push(`correlation_id:${correlation_id}`)

    const computation_id = payload.segmentComputationId
    if (computation_id) res.push(`computation_id:${computation_id}`)

    return res
  }
  getCorrelationId() {
    return this.payload.customArgs?.correlation_id || this.payload.customArgs?.__segment_internal_correlation_id__
  }
  getMessageId() {
    return (this.executeInput as any)['rawData']?.messageId // undocumented, not recommended way used here for tracing retries in logs https://github.com/segmentio/action-destinations/blob/main/packages/core/src/destination-kit/action.ts#L141
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
      externalIds: this.payload.externalIds?.map((eid) => ({
        id: this.redactPii(eid.id),
        channelType: eid.channelType,
        subStatus: eid.subscriptionStatus,
        type: eid.type
      })),
      shouldSend: this.payload.send,
      settings_region: this.settings.region,
      sourceId: this.settings.sourceId,
      spaceId: this.settings.spaceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageId: this.getMessageId(),
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

    const rejected = sendResults.filter((sr) => sr.status === 'rejected')

    // if there were errors - throw aggregated error, taking code and status from the first retryable error if present
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

/**
 * Serializer optimized for caching sendToRecepient response.
 * As success it only serializes status, as error it serializes status, message and code.
 * It was created for performance reasons, as so we don't use JSON.stringify and don't cache whole response object
 */
export const SendToRecepientResponseSerializer: CacheSerializer<any> = {
  stringify: (cacheable) => {
    if (cacheable.error && isRetryableError(cacheable.error)) return
    // we only stringify non-retryable error, retryable errors are not cached

    let cacheObj: ValueOrError<{ status: any }> | undefined = undefined
    if (cacheable.error) {
      const errorDetails = getErrorDetails(cacheable.error)
      cacheObj = { error: errorDetails }
    } else {
      cacheObj = { value: cacheable.value?.status }
    }
    return cacheObj ? JSON.stringify(cacheObj) : undefined
  },
  parse: (cachedValue) => {
    const parsed = JSON.parse(cachedValue) as ValueOrError<any>
    if (parsed.error) {
      const error = new IntegrationError(parsed.error.message, parsed.error.code, parsed.error.status)
      error.retry = false
      return { error }
    } else {
      return { value: { status: parsed.value } }
    }
  }
}
