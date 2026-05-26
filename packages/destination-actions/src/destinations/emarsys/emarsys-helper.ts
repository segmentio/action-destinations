import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import getAccessToken from './auth'
import { randomBytes } from 'crypto'
import { processHashing } from '../../lib/hashing-utils'

export const LEGACY_API_BASE = 'https://api.emarsys.net/api/v2/'

interface CachedToken {
  accessToken: string
  expiresAt: number // Unix timestamp in ms
}

export const tokenCache = new Map<string, CachedToken>()
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000 // 60 seconds

function getCacheKey(settings: Settings): string {
  return `${settings.apiAuthEndpoint}::${settings.apiClientId}`
}

export const isLegacyAuth = (settings: Settings): boolean => {
  return Boolean(settings.auth_type !== 'new')
}

export const getApiBaseUrl = (settings: Settings, specialPath?: string): string => {
  if (isLegacyAuth(settings)) {
    if (specialPath) {
      return LEGACY_API_BASE.replace(/\/api\/v2\//, specialPath)
    } else {
      return LEGACY_API_BASE
    }
  }
  if (!settings.apiBaseUrl) {
    throw new IntegrationError('API base URL is required', 'MISSING_API_BASE_URL', 400)
  }
  const apiBaseUrl = settings.apiBaseUrl.endsWith('/') ? settings.apiBaseUrl : `${settings.apiBaseUrl}/`
  if (specialPath) {
    return apiBaseUrl.replace(/\/api\/v\d+\//, specialPath)
  } else {
    return apiBaseUrl
  }
}

export const createWsseHeader = (settings: Settings): string => {
  if (!settings.api_user || !settings.api_password) {
    throw new IntegrationError('Username and password must be specified.', 'MISSING_CREDENTIALS', 400)
  }
  const nonce = randomBytes(16).toString('hex')
  const ts = new Date().toISOString()
  const secret = nonce + ts + settings.api_password
  const secretHex = processHashing(secret, 'sha1', 'hex')
  const secret_hash = Buffer.from(secretHex, 'utf8').toString('base64')
  return `UsernameToken Username="${settings.api_user}", PasswordDigest="${secret_hash}", Nonce="${nonce}", Created="${ts}"`
}

export const getAuthHeader = async (
  request: RequestClient,
  settings: Settings
): Promise<{ Authorization: string } | { 'X-WSSE': string }> => {
  if (isLegacyAuth(settings)) {
    return { 'X-WSSE': createWsseHeader(settings) }
  }

  const cacheKey = getCacheKey(settings)
  const cached = tokenCache.get(cacheKey)
  const now = Date.now()

  if (cached) {
    if (cached.expiresAt - now > TOKEN_EXPIRY_BUFFER_MS) {
      return { Authorization: `Bearer ${cached.accessToken}` }
    }
    tokenCache.delete(cacheKey)
  }

  if (!settings.apiAuthEndpoint) {
    throw new IntegrationError('Auth endpoint is required', 'MISSING_AUTH_ENDPOINT', 400)
  }

  const { accessToken, expiresIn } = await getAccessToken(
    request,
    settings.apiAuthEndpoint.replace(/\/$/, ''),
    settings.apiClientId as string,
    settings.apiClientSecret as string
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
  const data = await request(`${getApiBaseUrl(settings)}event`, { headers: authHeader })
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
    data = await request(`${getApiBaseUrl(settings)}field/translate/en`, { headers: authHeader })
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
  const data = await request(`${getApiBaseUrl(settings)}contactlist`, { headers: authHeader })
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
