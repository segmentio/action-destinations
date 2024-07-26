import { RequestClient, PayloadValidationError } from '@segment/actions-core'

import { Settings, AudienceSettings } from '../generated-types'
import { Unsubscriber, Subscriber } from '../types'
import { Payload } from './generated-types'

import { CONSTANTS } from '../constants'

export class IterableListsClient {
  apiKey: string
  request: RequestClient
  updateExistingUsersOnly?: boolean
  globalUnsubscribe?: boolean
  campaignId?: number

  constructor( request: RequestClient, settings: Settings, audienceSettings: AudienceSettings | undefined) {
    if(!audienceSettings){
      throw new PayloadValidationError('AudienceSettings missing from payload')
    }
    this.request = request
    this.apiKey = settings.apiKey
    this.updateExistingUsersOnly = typeof audienceSettings.updateExistingUsersOnly === 'boolean' ? audienceSettings.updateExistingUsersOnly : undefined, 
    this.globalUnsubscribe = typeof audienceSettings.globalUnsubscribe === 'boolean' ? audienceSettings.globalUnsubscribe : undefined,
    this.campaignId = audienceSettings.campaignId ? Number(audienceSettings.campaignId) : undefined
  }

  async processPayload(payloads: Payload[]) {

    const subscribersGroup: Map<string, Subscriber[]> = new Map()
    const unsubscribersGroup: Map<string, Unsubscriber[]> = new Map()

    payloads.map((payload) => {
      const listId = payload.segmentAudienceId
      if (payload.traitsOrProperties[payload.segmentAudienceKey] === true) {

        const subscriber = {
          email: payload?.email ?? undefined,
          dataFields: payload?.dataFields?.reduce((acc: { [key: string]: any }, item: string) => {
            acc[item] = payload.traitsOrProperties[item];
            return acc
          }, {}),
          userId: payload?.userId ?? undefined,
          preferUserId: true
        } as Subscriber

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

    const subcribeRequests = []
    const unSubcribeRequests = [] 
    
    subscribersGroup.forEach((subscribers, listId) => {
      subcribeRequests.push(
//        this.request(`${CONSTANTS.API_BASE_URL}/lists/subscribe`, {
        this.request(`https://webhook.site/e2116ce8-9737-47b0-880b-936a9dee363f`, {
          method: 'post',
          json: {
            listId: listId,
            subscribers,
            updateExistingUsersOnly: this.updateExistingUsersOnly
          }
        })
      )
    })

    unsubscribersGroup.forEach((subscribers, listId) => {
      unSubcribeRequests.push(
//        this.request(`${CONSTANTS.API_BASE_URL}/lists/unsubscribe`, {
        this.request(`https://webhook.site/e2116ce8-9737-47b0-880b-936a9dee363f`, {
          method: 'post',
          json: {
            listId: listId,
            subscribers,
            campaignId: typeof this.campaignId === 'number' ? this.campaignId : undefined,
            channelUnsubscribe: this.updateExistingUsersOnly
          }
        })
      )
    })

    return await Promise.all([...unsubscribersGroup,...subscribersGroup])
  }

  static validate(payload: Payload) {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Either Email or User ID fields must be populated.')
    }
  }

}