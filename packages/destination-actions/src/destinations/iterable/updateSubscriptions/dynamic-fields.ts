import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DataCenterLocation } from '../shared-fields'
import { getRegionalEndpoint } from '../utils'
import type { DynamicFieldContext, ChannelsResponse, MessageTypesResponse, ListsResponse } from './types'

export async function getSubscriptionGroupId(
  request: RequestClient,
  { payload, dynamicFieldContext, settings }: { payload: Payload; dynamicFieldContext?: DynamicFieldContext; settings: Settings }
): Promise<DynamicFieldResponse> {
  const { selectedArrayIndex: index = 0 } = dynamicFieldContext ?? {}
  const groupType = payload?.subscriptions?.[index]?.subscription_group_type
  const { dataCenterLocation } = settings

  if (!groupType) {
    return {
      choices: [],
      error: {
        code: 'MISSING_GROUP_TYPE',
        message: "Select a 'Subscription Group Type' first."
      }
    }
  }

  const endpoint = getRegionalEndpoint(
    groupType === 'messageChannel' ? 'getChannels' : groupType === 'messageType' ? 'getMessageTypes' : 'getLists',
    dataCenterLocation as DataCenterLocation
  )

  switch (groupType) {
    case 'messageChannel':
      return fetchChannels(request, endpoint)
    case 'messageType':
      return fetchMessageTypes(request, endpoint)
    case 'emailList':
      return fetchLists(request, endpoint)
    default:
      return {
        choices: [],
        error: {
          code: 'INVALID_GROUP_TYPE',
          message: `Unknown subscription group type: ${groupType}`
        }
      }
  }
}

async function fetchChannels(request: RequestClient, endpoint: string): Promise<DynamicFieldResponse> {
  const response = await request<ChannelsResponse>(endpoint, { method: 'get' })
  const choices = response.data.channels.map(({ id, name, messageMedium, channelType }) => ({
    label: `${name} (${messageMedium} - ${channelType})`,
    value: String(id)
  }))
  return { choices }
}

async function fetchMessageTypes(request: RequestClient, endpoint: string): Promise<DynamicFieldResponse> {
  const response = await request<MessageTypesResponse>(endpoint, { method: 'get' })
  const choices = response.data.messageTypes.map(({ id, name, subscriptionPolicy }) => ({
    label: `${name} (${subscriptionPolicy})`,
    value: String(id)
  }))
  return { choices }
}

async function fetchLists(request: RequestClient, endpoint: string): Promise<DynamicFieldResponse> {
  const response = await request<ListsResponse>(endpoint, { method: 'get' })
  const choices = response.data.lists.map(({ id, name, listType }) => ({
    label: `${name} (${listType})`,
    value: String(id)
  }))
  return { choices }
}
