/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { RetryableError } from "@segment/actions-core";
import { EngageActionPerformer } from './EngageActionPerformer'
import { isRetryableError } from './isRetryableError'
import { AggregateError } from './AggregateError'
import { MaybePromise } from '@segment/actions-core/destination-kit/types'
import { getProfileApiEndpoint, Region } from './getProfileApiEndpoint'
import { track } from './track'
import { PayloadValidationError } from '@segment/actions-core'

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
  async doPerform() {
    // sending messages and collecting results, including exceptions
    const res = this.forAllRecepients((recepient) => this.sendToRecepient(recepient))

    // only if it succeeded, we can send stats
    this.statsEventDeliveryTs()
    return res
  }

  /*
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

    const didNotSubTag = supportedExtIdsWithSub?.some((e) => e.extId.subscriptionStatus == '')
    this.currentOperation?.tags.push('did_not_subscribe:' + didNotSubTag)

    if (!supportedExtIdsWithSub || !supportedExtIdsWithSub.length)
      return {
        sendabilityStatus: SendabilityStatus.NoSupportedExternalIds
      }

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

  abstract sendToRecepient(recepient: ExtId<TPayload>): any

  /**
   * populate the logDetails object with the data that should be logged for every message
   */
  beforePerform() {
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
      if (sendResults[0].status === 'rejected') {
        throw sendResults[0].error
      } else {
        return sendResults[0].result
      }
    }

    const fulfilled = sendResults.filter((sr) => sr.status === 'fulfilled')

    // if at least one succeeded, return array of fullfiled values
    if (fulfilled.length) {
      return fulfilled.map((sr) => sr.result)
    }

    // if we are here, then some failed
    const rejected = sendResults.filter((sr) => sr.status === 'rejected')

    // if all retriable, throw aggregated with first code and status
    if (rejected.every((r) => isRetryableError(r.error))) {
      throw AggregateError.create({
        errors: rejected.map((r) => r.error),
        message: (msg) => 'Failed to send to all subscribed recepients (retryable):' + msg
      })
    }

    //NON RETRYABLE CASE:
    const firstNonRetryable = rejected.find((r) => !isRetryableError(r.error))?.error
    throw AggregateError.create({
      errors: rejected.map((r) => r.error),
      //code: "UNEXPECTED_ERROR",
      takeCodeAndStatusFromError: firstNonRetryable,
      message: (msg) => 'Failed to send to all subscribed recepients (non-retryable):' + msg
    })
  }

  @track({
    wrapIntegrationError: () => ['Unable to get profile traits', 'SMS trait fetch failure', 500]
  })
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
