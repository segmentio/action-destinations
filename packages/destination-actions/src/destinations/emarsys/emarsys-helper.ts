import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { randomBytes, createHash } from 'crypto'

export const API_HOST = 'https://api.emarsys.net'
export const API_PATH = '/api/v2/'
export const API_BASE = `${API_HOST}${API_PATH}`

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

export const createWsseHeader = (settings: Settings): string => {
  if (!settings.api_user || !settings.api_password) {
    throw new IntegrationError('Username and password must be specified.')
  }
  const nonce = randomBytes(16).toString('hex')
  const hash = createHash('sha1')
  const ts = new Date().toISOString()
  const secret = nonce + ts + settings.api_password
  const secret_hash = Buffer.from(hash.update(secret).digest('hex')).toString('base64')
  const auth_header = `UsernameToken Username="${settings.api_user}", PasswordDigest="${secret_hash}", Nonce="${nonce}", Created="${ts}"`
  return auth_header
}

export const getEvents = async (request: RequestClient): Promise<DynamicFieldResponse> => {
  const data = await request(`${API_BASE}event`)
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
  const events = {
    choices: choices
  }
  return events
}

export const getFields = async (request: RequestClient): Promise<DynamicFieldResponse> => {
  const data = await request(`${API_BASE}field/translate/en`)
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

export const getContactLists = async (request: RequestClient): Promise<DynamicFieldResponse> => {
  const data = await request(`${API_BASE}contactlist`)
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
  const lists = {
    choices: choices
  }
  return lists
}
