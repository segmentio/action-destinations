import { RequestClient, PayloadValidationError, ModifiedResponse } from '@segment/actions-core'

import { Settings, AudienceSettings } from '../generated-types'
import { Unsubscriber, Subscriber, IterableSubscribePayload, IterableUnsubscribePayload } from '../types'
import { Payload } from './generated-types'

import { CONSTANTS } from '../constants'

export class IterableListsClient {
  apiKey: string
  request: RequestClient
  updateExistingUsersOnly?: boolean
  globalUnsubscribe?: boolean
  campaignId?: number

  constructor(request: RequestClient, settings: Settings, audienceSettings?: AudienceSettings | undefined) {
    this.request = request
    this.apiKey = settings.apiKey
    this.updateExistingUsersOnly =
      typeof audienceSettings?.updateExistingUsersOnly === 'boolean'
        ? audienceSettings.updateExistingUsersOnly
        : undefined
    this.globalUnsubscribe =
      typeof audienceSettings?.globalUnsubscribe === 'boolean' ? audienceSettings.globalUnsubscribe : undefined
    this.campaignId = typeof audienceSettings?.campaignId === 'number' ? audienceSettings.campaignId : undefined
  }

  async processPayload(payloads: Payload[]) {
    const subscribersGroup: Map<string, Subscriber[]> = new Map()
    const unsubscribersGroup: Map<string, Unsubscriber[]> = new Map()

    payloads.map((payload) => {
      const listId = payload.segmentAudienceId
      if (payload.traitsOrProperties[payload.segmentAudienceKey] === true) {
        const subscriber = {
          email: payload?.email ?? undefined,
          userId: payload?.userId ?? undefined,
          preferUserId: true
        } as Subscriber

        if (payload?.dataFields) {
          subscriber.dataFields = payload.dataFields as Record<string, null | boolean | string | number | object>
        }

        if (subscribersGroup.has(listId)) {
          subscribersGroup.get(listId)?.push(subscriber)
        } else {
          subscribersGroup.set(listId, [subscriber])
        }
      } else {
        const subscriber = {
          email: payload?.email ?? undefined,
          userId: payload?.userId ?? undefined
        } as Unsubscriber

        if (unsubscribersGroup.has(listId)) {
          unsubscribersGroup.get(listId)?.push(subscriber)
        } else {
          unsubscribersGroup.set(listId, [subscriber])
        }
      }
    })

    const subscribeRequests: Promise<ModifiedResponse>[] = []
    const unsubscribeRequests: Promise<ModifiedResponse>[] = []

    subscribersGroup.forEach((subscribers, listId) => {
      const json: IterableSubscribePayload = {
        listId: Number(listId),
        subscribers,
        updateExistingUsersOnly: this.updateExistingUsersOnly
      }
      subscribeRequests.push(
        this.request(`${CONSTANTS.API_BASE_URL}/lists/subscribe`, {
          method: 'post',
          skipResponseCloning: true,
          json
        })
      )
    })

    unsubscribersGroup.forEach((subscribers, listId) => {
      const json: IterableUnsubscribePayload = {
        listId: Number(listId),
        subscribers,
        campaignId: typeof this.campaignId === 'number' ? this.campaignId : undefined,
        channelUnsubscribe: this.globalUnsubscribe
      }
      unsubscribeRequests.push(
        this.request(`${CONSTANTS.API_BASE_URL}/lists/unsubscribe`, {
          method: 'post',
          skipResponseCloning: true,
          json
        })
      )
    })

    return await Promise.all([...subscribeRequests, ...unsubscribeRequests])
  }

  static validate(payload: Payload) {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Either Email or User ID fields must be populated.')
    }
  }
}
