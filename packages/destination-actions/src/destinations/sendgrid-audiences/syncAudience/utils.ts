import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import {
  UPSERT_CONTACTS_URL,
  SEARCH_CONTACTS_URL,
  REMOVE_CONTACTS_FROM_LIST_URL,
  MAX_CHUNK_SIZE_SEARCH,
  MAX_CHUNK_SIZE_REMOVE,
  E164_REGEX
} from '../constants'
import { UpsertContactsReq, SearchContactsResp, AddRespError } from '../types'
import chunk from 'lodash/chunk'

export async function send(request: RequestClient, payload: Payload[]) {
  const payloads = validate(payload)
  const addPayloads = payloads.filter((p) => p.traits_or_props[p.segment_audience_key] === true)
  if(addPayloads.length > 0) {
    await upsertContacts(request, addPayloads, true) 
  }
 
  const removePayloads = payloads.filter((p) => p.traits_or_props[p.segment_audience_key] === false)
  if(removePayloads.length > 0) {
    const upsertedRemovePayloads = await upsertContacts(request, removePayloads, false) 
    await removeFromList(request, upsertedRemovePayloads) // there is no API call to upsert a Contact and also remove them from a list at the same time, so we need to do these operations separately
  }
}

function validate(payloads: Payload[], invalidEmails?: string[]): Payload[] {
  if (payloads[0].external_audience_id == null) {
    throw new PayloadValidationError('external_audience_id value is missing from payload')
  }

  const validPayloads = payloads.map(payload => validatePayload(payload, invalidEmails)).filter((payload): payload is Payload => payload !== undefined)

  if (validPayloads.length === 0) {
    throw new PayloadValidationError('No valid payloads found')
  }

  return validPayloads
}

function validatePayload(payload: Payload, invalidEmails?: string[]): Payload | undefined {
  
  const p = JSON.parse(JSON.stringify(payload))
  
  if (p.identifiers.email && invalidEmails?.includes(p.identifiers.email)) {
    delete p.identifiers.email
  }

  if (p.identifiers.phone_number_id && !validatePhone(p.identifiers.phone_number_id)) {
    delete p.identifiers.phone_number_id
  }

  if (p.user_attributes) {
    if (p.user_attributes.phone_number && !validatePhone(p.user_attributes.phone_number)) {
      delete p.user_attributes.phone_number
    }
  
    p.user_attributes = Object.fromEntries(
      Object.entries(p.user_attributes ?? {}).map(([key, value]) => {
        if (typeof value !== 'string') {
          return [key, String(value)]
        }
        return [key, value]
      })
    )
  }

  if (p.custom_text_fields) {
    p.custom_text_fields = Object.fromEntries(
      Object.entries(p.custom_text_fields).filter(([_, value]) => typeof value === 'string' && value.length > 0)
    )
  }

  if (p.custom_number_fields) {
    p.custom_number_fields = Object.fromEntries(
      Object.entries(p.custom_number_fields).filter(([_, value]) => typeof value === 'number')
    )
  }

  if (p.custom_date_fields) {
    p.custom_date_fields = Object.fromEntries(
      Object.entries(p.custom_date_fields)
        .filter(([_, value]) => typeof value === 'string') 
        .map(([key, value]) => [key, toDateFormat(value as string)])
        .filter(([_, value]) => typeof value === 'string') 
    )
  }

  const requiredIdentifiers = [
    p.identifiers.email,
    p.identifiers.phone_number_id,
    p.identifiers.external_id,
    p.identifiers.anonymous_id
  ]

  return requiredIdentifiers.some(Boolean) ? p : undefined 
}

async function upsertContacts(request: RequestClient, payloads: Payload[], addToList: boolean): Promise<Payload[]>{
  try {
    const json = upsertJSON(payloads, addToList)
    await upsertRequest(request, json) // make the initial upsert request
  } catch (error) {
    const { status, data } = (error as AddRespError).response
    if (status !== 400) {
      throw error
    }
    const invalidEmails = Array.isArray(data.errors)
      ? data.errors
          .map(({ message }) => /email '(.+?)' is not valid/.exec(message)?.[1])
          .filter((email): email is string => !!email)
      : []
    if (invalidEmails.length === 0) {
      throw error
    }
    payloads = validate(payloads, invalidEmails)
    const json2 = upsertJSON(payloads, addToList)
    if (payloads.length > 0) {
      await upsertRequest(request, json2) // if the initial upsert request fails, remove the failing emails and make the request again
    }
  }
  return payloads
}

function upsertJSON(payloads: Payload[], addToList: boolean): UpsertContactsReq {  
  const json: UpsertContactsReq = {
    list_ids: addToList ? [payloads[0].external_audience_id] : [],
    contacts: payloads.map((payload) => {

      const {
        identifiers: {
          email = undefined,
          phone_number_id = undefined,
          external_id = undefined,
          anonymous_id = undefined
        },
        user_attributes = undefined,
        custom_text_fields = undefined,
        custom_number_fields = undefined,
        custom_date_fields = undefined
      } = payload
      
      const custom_fields = {
        ...custom_text_fields,
        ...custom_number_fields,
        ...custom_date_fields
      }

      return {
        email,
        phone_number_id,
        external_id,
        anonymous_id,
        ...user_attributes,
        custom_fields: Object.keys(custom_fields).length > 0 ? custom_fields : undefined
      }
    }) as UpsertContactsReq['contacts']
  }

  return JSON.parse(JSON.stringify(json)) // remove undefined values
}

async function upsertRequest(request: RequestClient, json: UpsertContactsReq) {  
  return await request(UPSERT_CONTACTS_URL, {
    method: 'put',
    json
  })
}

async function removeFromList(request: RequestClient, payloads: Payload[]) {
  if (payloads.length === 0) {
    return 
  }

  const identifierTypes: (keyof Payload['identifiers'])[] = ['email', 'phone_number_id', 'external_id', 'anonymous_id']
  const chunks = chunkPayloads(payloads)

  const queries = chunks.map((c) =>
    identifierTypes
      .map((idType) => getQueryPart(idType, c))
      .filter((query) => query !== '')
      .join(' OR ')
  )

  const responses = await Promise.all(
    queries.map((query) =>
      request<SearchContactsResp>(SEARCH_CONTACTS_URL, {
        method: 'post',
        json: {
          query
        }
      })
    )
  )

  const contact_ids = responses.flatMap((response) => response.data.result.map((item) => item.id))
  const chunkedContactIds = chunk(contact_ids, MAX_CHUNK_SIZE_REMOVE)
  const listId = payloads[0].external_audience_id

  await Promise.all(
    chunkedContactIds.map(async (c) => {
      const url = REMOVE_CONTACTS_FROM_LIST_URL.replace('{list_id}', listId).replace('{contact_ids}', c.join(','))
      if (c.length > 0) {
        await request(url, {
          method: 'delete'
        })
      }
    })
  )
}

function chunkPayloads(payloads: Payload[]): Payload[][] {
  const chunks: Payload[][] = []
  let currentChunk: Payload[] = []
  let currentChunkSize = 0

  for (const payload of payloads) {
    const ids = payload.identifiers
    const idCount = [ids.email, ids.phone_number_id, ids.external_id, ids.anonymous_id].filter(
      Boolean
    ).length

    if (currentChunkSize + idCount > MAX_CHUNK_SIZE_SEARCH) {
      chunks.push(currentChunk)
      currentChunk = []
      currentChunkSize = 0
    }

    currentChunk.push(payload)
    currentChunkSize += idCount
  }

  if (currentChunk.length) {
    chunks.push(currentChunk)
  }

  return chunks
}

function getQueryPart(identifier: keyof Payload['identifiers'], payloads: Payload[]): string {
  const values = payloads
    .filter((payload) => payload.identifiers[identifier] !== undefined && payload.identifiers[identifier] !== null)
    .map((payload) => payload.identifiers[identifier])

  const part = values.length > 0 ? `${identifier} IN (${values.map((value) => `'${value}'`).join(',')})` : ''
  return part
}

export function validatePhone(phone: string): boolean {
  return E164_REGEX.test(phone)
}

export function toDateFormat(dateString: string): string | undefined {
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? undefined : `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
}