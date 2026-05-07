import type { Settings } from './generated-types'
import type { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import getAccessToken from './auth'

interface CachedToken {
  accessToken: string
  expiresAt: number // Unix timestamp in ms
}

const tokenCache = new Map<string, CachedToken>()
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000 // 60 seconds

function getCacheKey(settings: Settings): string {
  return `${settings.apiAuthEndpoint}::${settings.apiClientId}`
}

export const getAuthHeader = async (request: RequestClient, settings: Settings): Promise<{ Authorization: string }> => {
  const cacheKey = getCacheKey(settings)
  const cached = tokenCache.get(cacheKey)
  const now = Date.now()

  if (cached && cached.expiresAt - now > TOKEN_EXPIRY_BUFFER_MS) {
    return { Authorization: `Bearer ${cached.accessToken}` }
  }

  const { accessToken, expiresIn } = await getAccessToken(
    request,
    settings.apiAuthEndpoint,
    settings.apiClientId,
    settings.apiClientSecret
  )

  tokenCache.set(cacheKey, {
    accessToken,
    expiresAt: now + expiresIn * 1000
  })

  return { Authorization: `Bearer ${accessToken}` }
}

/**
 * Types triggerEvent
 */
export interface TriggerEventData {
  [k: string]: unknown
}

export interface BufferBatchTriggerEventItem {
  event_id: number
  key_id: string
  keys: {
    external_id: string
    data?: TriggerEventData
  }[]
}

export interface TriggerEventApiPayload {
  key_id: string
  external_id: string
  data?: TriggerEventData
}

export interface TriggerEventsApiPayload {
  key_id: string
  contacts: {
    external_id: string
    data?: TriggerEventData
  }[]
}

export interface BufferBatchTriggerEvent {
  [k: string]: BufferBatchTriggerEventItem
}

/**
 * Types (remove|add)ToContactList
 */
export interface ContactListApiPayload {
  contactlistid?: number
  key_id: string
  external_ids: string[]
}

export interface BufferBatchContactListItem {
  contactlistid: number
  key_id: string
  external_ids: string[]
}

export interface BufferBatchContactList {
  [k: string]: BufferBatchContactListItem
}

/**
 * Types upsertContact
 */
export interface ContactData {
  [k: string]: unknown
}

export interface BufferBatchContactItem {
  key_id: string
  contacts: ContactData[]
}

export interface BufferBatchContacts {
  [k: string]: BufferBatchContactItem
}

export interface ContactsApiPayload {
  key_id: string
  contacts: ContactData[]
}

export const getEvents = async (request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> => {
  const authHeader = await getAuthHeader(request, settings)
  const data = await request(`${settings.apiBaseUrl}event`, { headers: authHeader })
  const choices = []
  if (data && data.content) {
    const api_data = JSON.parse(data.content)
    if (api_data && api_data.replyCode !== undefined && api_data.replyCode == 0) {
      if (api_data.data && Array.isArray(api_data.data) && api_data.data.length > 0) {
        for (let a = 0; a < api_data.data.length; a++) {
          choices.push({
            label: api_data.data[a].name,
            value: api_data.data[a].id
          })
        }
      }
    }
  }
  const fields = {
    choices: choices
  }
  return fields
}

export const getFields = async (request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> => {
  const authHeader = await getAuthHeader(request, settings)
  let data
  try {
    data = await request(`${settings.apiBaseUrl}field/translate/en`, { headers: authHeader })
  } catch (err) {
    return { choices: [] }
  }
  const choices = []
  if (data && data.content) {
    const api_data = JSON.parse(data.content)
    if (api_data && api_data.replyCode !== undefined && api_data.replyCode == 0) {
      if (api_data.data && Array.isArray(api_data.data) && api_data.data.length > 0) {
        for (let a = 0; a < api_data.data.length; a++) {
          choices.push({
            label: api_data.data[a].name,
            value: api_data.data[a].id
          })
        }
      }
    }
  }
  const fields = {
    choices: choices
  }
  return fields
}

export const getContactLists = async (request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> => {
  const authHeader = await getAuthHeader(request, settings)
  const data = await request(`${settings.apiBaseUrl}contactlist`, { headers: authHeader })
  const choices = []
  if (data && data.content) {
    const api_data = JSON.parse(data.content)
    if (api_data && api_data.replyCode !== undefined && api_data.replyCode == 0) {
      if (api_data.data && Array.isArray(api_data.data) && api_data.data.length > 0) {
        for (let a = 0; a < api_data.data.length; a++) {
          choices.push({
            label: api_data.data[a].name,
            value: api_data.data[a].id
          })
        }
      }
    }
  }
  const fields = {
    choices: choices
  }
  return fields
}
