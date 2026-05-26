import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { DataCenterLocation } from '../shared-fields'
import { getRegionalEndpoint } from '../utils'
import type { ChannelDetails, MessageTypeDetails, ListDetails } from './types'

export async function fetchChannels(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  const endpoint = getRegionalEndpoint('getChannels', settings.dataCenterLocation as DataCenterLocation)
  const response = await request<{ channels: ChannelDetails[] }>(endpoint, { method: 'get' })
  const choices = response.data.channels.map((channel) => ({
    label: `${channel.name} (${channel.messageMedium} - ${channel.channelType})`,
    value: String(channel.id)
  }))
  return { choices }
}

export async function fetchMessageTypes(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  const endpoint = getRegionalEndpoint('getMessageTypes', settings.dataCenterLocation as DataCenterLocation)
  const response = await request<{ messageTypes: MessageTypeDetails[] }>(endpoint, { method: 'get' })
  const choices = response.data.messageTypes.map((mt) => ({
    label: `${mt.name} (${mt.subscriptionPolicy})`,
    value: String(mt.id)
  }))
  return { choices }
}

export async function fetchLists(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  const endpoint = getRegionalEndpoint('getLists', settings.dataCenterLocation as DataCenterLocation)
  const response = await request<{ lists: ListDetails[] }>(endpoint, { method: 'get' })
  const choices = response.data.lists.map((list) => ({
    label: `${list.name} (${list.listType})`,
    value: String(list.id)
  }))
  return { choices }
}
