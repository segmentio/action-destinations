import { RequestClient, MultiStatusResponse, ErrorCodes, ModifiedResponse, JSONLikeObject } from '@segment/actions-core'
import type { Payload } from './generated-types'
import {
  UPSERT_CONTACTS_URL,
  SEARCH_CONTACTS_URL,
  REMOVE_CONTACTS_FROM_LIST_URL,
  MAX_CHUNK_SIZE_SEARCH,
  MAX_CHUNK_SIZE_REMOVE,
  E164_REGEX
} from '../constants'
import { IndexedPayload, UpsertContactsReq, SearchContactsResp, AddRespError, Action } from '../types'
import chunk from 'lodash/chunk'

export async function send(request: RequestClient, payload: Payload[], isBatch: boolean){
  const msResponse = new MultiStatusResponse()

  const indexedPayloads: IndexedPayload[] = payload.map((p, index) => ({ ...p, index }))
  indexedPayloads.forEach((p) => {
    p.action = p.traits_or_props[p.segment_audience_key] === true ? 'add' : 'remove'
  })

  validate(indexedPayloads)

  await upsertContacts(request, indexedPayloads, 'add') // upsert contacts and add them to the list
  await upsertContacts(request, indexedPayloads, 'remove') // upsert contacts who will later be removed from the list
  await removeFromList(request, indexedPayloads) // remove the contacts from the list

  indexedPayloads.forEach((p) => {
    if(p.error){
      const { status, errortype, errormessage } = p.error
      msResponse.setErrorResponseAtIndex(p.index, { status, errortype, errormessage})
    } else {
      msResponse.setSuccessResponseAtIndex(p.index, {
        status: 200,
        sent: p as unknown as JSONLikeObject,
        body: 'success'
      })
    }
  })

  return isBatch ? msResponse : msResponse.getResponseAtIndex(0)
}

function validate(payloads: IndexedPayload[], invalidEmails?: string[]) {
  if (payloads[0].external_audience_id == null) {
    assignErrors(payloads, undefined, 400, 'external_audience_id value is missing from payload', ErrorCodes.PAYLOAD_VALIDATION_FAILED)
    return
  }

  payloads.forEach((p) => {
    validatePayload(p, invalidEmails)
  })
}

function validatePayload(payload: IndexedPayload, invalidEmails?: string[]) {

  if (payload.identifiers.email && invalidEmails?.includes(payload.identifiers.email)) {
    assignErrors([payload], undefined, 400, `Sendgrid rejected email '${payload.identifiers.email}' as being not valid`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
    return
  }

  if (payload.identifiers.phone_number_id && !validatePhone(payload.identifiers.phone_number_id)) {
    assignErrors([payload], undefined, 400, `phone_number_id '${payload.identifiers.phone_number_id}' is not valid`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
    return
  }

  if (payload.user_attributes?.phone_number && !validatePhone(payload.user_attributes.phone_number)) {
    assignErrors([payload], undefined, 400, `user_attributes.phone_number '${payload.user_attributes.phone_number}' is not valid`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
    return
  }

  for (const [key, value] of Object.entries(payload.custom_text_fields ?? {})) {
    if (typeof value !== 'string') {
      assignErrors([payload], undefined, 400, `custom_text_fields ${key} value ${value} is not a string`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
      return
    }
  }

  for (const [key, value] of Object.entries(payload.custom_number_fields ?? {})) {
    if (typeof value !== 'number') {
      assignErrors([payload], undefined, 400, `custom_number_fields ${key} value ${value} is not a number`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
      return
    }
  }

  if (payload.custom_date_fields) {
    for (const [key, value] of Object.entries(payload.custom_date_fields)) {
      if (typeof value !== 'string') {
        assignErrors([payload], undefined, 400, `custom_number_fields ${key} value ${value} is not a valid date`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
        return
      } else {
        const date = toDateFormat(value)
        if (date === undefined) {
          assignErrors([payload], undefined, 400, `custom_number_fields ${key} value ${value} is not a valid date`, ErrorCodes.PAYLOAD_VALIDATION_FAILED)
          return
        }
        payload.custom_date_fields[key] = date
      }
    }
  }

  const requiredIdentifiers = [
    payload.identifiers.email,
    payload.identifiers.phone_number_id,
    payload.identifiers.external_id,
    payload.identifiers.anonymous_id
  ]

  if(!requiredIdentifiers.some(Boolean)) {
    assignErrors([payload], undefined, 400, 'At least one identifier from Email Address, Phone Number ID, Anonymous ID or External ID is required.', ErrorCodes.PAYLOAD_VALIDATION_FAILED)
    return
  }
}

async function upsertContacts(request: RequestClient, payloads: IndexedPayload[], action: Action){
  try {
    const json = upsertJSON(payloads, action)
    if(json.contacts.length > 0) {
      await upsertRequest(request, json) // initial upsert attempt
    }
    return
  } 
  catch (error) {
    const { status, data } = (error as AddRespError).response
    if (status === 400) {
      const invalidEmails = Array.isArray(data.errors)
        ? data.errors
            .map(({ message }) => /email '(.+?)' is not valid/.exec(message)?.[1])
            .filter((email): email is string => !!email)
        : []

      validate(payloads, invalidEmails)
      const json2 = upsertJSON(payloads, action)

      try {
        if(json2.contacts.length > 0) {
          await upsertRequest(request, json2) // second upsert attempt if some emails were invalid from the first attempt
          return 
        }
      } 
      catch {
        assignErrors(payloads, action, status, 'Error occurred while upserting this contact to Sendgrid', ErrorCodes.UNKNOWN_ERROR)
        return
      }
    } 
    assignErrors(payloads, action, status, 'Error occurred while upserting this contact to Sendgrid', ErrorCodes.UNKNOWN_ERROR)
    return
  }
}

function upsertJSON(payloads: IndexedPayload[], action: Action): UpsertContactsReq {  
  const json: UpsertContactsReq = {
    list_ids: action === 'add' ? [payloads[0].external_audience_id] : [],
    contacts: payloads
      .filter((payload) => !payload.error)
      .map((payload) => {
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

async function removeFromList(request: RequestClient, payloads: IndexedPayload[]) {
  
  if (payloads.length === 0) {
    return 
  }

  const identifierTypes: (keyof IndexedPayload['identifiers'])[] = ['email', 'phone_number_id', 'external_id', 'anonymous_id']
  const chunks = chunkPayloads(payloads)

  const queries = chunks.map((c) =>
    identifierTypes
      .map((idType) => getQueryPart(idType, c))
      .filter((query) => query !== '')
      .join(' OR ')
  )

  let responses: ModifiedResponse<SearchContactsResp>[] = []

  try{
    responses = await Promise.all(
      queries.map((query) =>
        request<SearchContactsResp>(SEARCH_CONTACTS_URL, {
          method: 'post',
          json: {
            query
          }
        })
      )
    )
  } catch(error){
    assignErrors(payloads, 'remove', 400, `Error occurred while searching for Contacts in SendGrid`, ErrorCodes.UNKNOWN_ERROR)
    return
  }

  const contact_ids = responses.flatMap((response) => response.data.result.map((item) => item.id))
  const chunkedContactIds = chunk(contact_ids, MAX_CHUNK_SIZE_REMOVE)
  const listId = payloads[0].external_audience_id
  
  try {
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
  catch(error){
    assignErrors(payloads, 'remove', 400, `Error occurred while removing Contacts from a List in SendGrid`, ErrorCodes.UNKNOWN_ERROR)
    return
  }
}

function chunkPayloads(payloads: IndexedPayload[]): IndexedPayload[][] {
  const chunks: IndexedPayload[][] = []
  let currentChunk: IndexedPayload[] = []
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

function getQueryPart(identifier: keyof IndexedPayload['identifiers'], payloads: IndexedPayload[]): string {
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

function assignErrors(payloads: IndexedPayload[], action?: Action, status = 400, errormessage = "Unknown error", errortype: keyof typeof ErrorCodes = ErrorCodes.UNKNOWN_ERROR) {
  payloads
    .filter((p) => action ? p.action === action : true)
    .forEach((p) => {
      p.error = {
        errormessage,
        errortype,
        status,
      }
    })
}