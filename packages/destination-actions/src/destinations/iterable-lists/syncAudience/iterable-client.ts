import { IntegrationError, ModifiedResponse, PayloadValidationError, RequestOptions } from '@segment/actions-core'

import { Settings } from '../generated-types'
import { UpsertUserPayload } from '../types'
import { Payload } from './generated-types'

import { CONSTANTS } from '../constants'

export class IterableListsClient {
  apiKey: string
  request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>

  constructor(
    request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>,
    settings: Settings
  ) {
    this.request = request

    if (!settings.apiKey) {
      throw new IntegrationError('API Key is required', 'INVALID_CONFIG', 422)
    }

    this.apiKey = settings.apiKey
  }

  async processPayload(payload: Payload[]): Promise<unknown> {
    const iterablePayloads: { [key: number]: UpsertUserPayload[] } = {}

    for (const singlePayload of payload) {
      const processedPayload = this.validateSinglePayload(singlePayload)
      if (processedPayload.listId) {
        const currentListId = processedPayload.listId
        delete processedPayload.listId
        if (!(currentListId in iterablePayloads)) {
          iterablePayloads[currentListId] = []
        }

        iterablePayloads[currentListId].push(processedPayload)
      }
    }

    const promises = []
    for (const [listId, payloads] of Object.entries(iterablePayloads)) {
      const addedProfiles = [],
        removedProfiles = []
      for (const resolvedIterablePayload of payloads) {
        if (resolvedIterablePayload.action === 'subscribe') {
          addedProfiles.push(resolvedIterablePayload)
        } else {
          delete resolvedIterablePayload.dataFields
          removedProfiles.push(resolvedIterablePayload)
        }

        delete resolvedIterablePayload.action
      }

      promises.push(
        this.request(`${CONSTANTS.API_BASE_URL}/lists/subscribe`, {
          method: 'post',
          json: {
            listId: Number(listId),
            subscribers: addedProfiles,
            updateExistingUsersOnly: false
          }
        })
      )

      promises.push(
        this.request(`${CONSTANTS.API_BASE_URL}/lists/unsubscribe`, {
          method: 'post',
          json: {
            listId: Number(listId),
            subscribers: removedProfiles,
            updateExistingUsersOnly: false
          }
        })
      )
    }

    return this.processBatch(promises)
  }

  private async processBatch(promises: Promise<unknown>[]) {
    return await Promise.all(promises)
  }

  private validateSinglePayload(payload: Payload): UpsertUserPayload {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Must include email or user_id.')
    }

    if (!payload.segmentAudienceKey || !payload.segmentAudienceId) {
      throw new PayloadValidationError('Missing audience parameters: computation key and/or audience id.')
    }

    const action = payload.traitsOrProperties[payload.segmentAudienceKey] ? 'subscribe' : 'usubscribe'
    const iterablePayload: UpsertUserPayload = {
      listId: Number(payload.segmentAudienceId),
      action: action,
      dataFields: payload.traitsOrProperties,
      preferUserId: true,
      mergeNestedObjects: true
    }

    if (payload.email) {
      iterablePayload.email = payload.email
    }

    if (payload.userId) {
      iterablePayload.userId = payload.userId
    }

    return iterablePayload
  }
}
