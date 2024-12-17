import { RequestClient, MultiStatusResponse, ErrorCodes, ModifiedResponse } from '@segment/actions-core'
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

  await upsertContacts(request, indexedPayloads, 'add') 
  await upsertContacts(request, indexedPayloads, 'remove') 

  await removeFromList(request, indexedPayloads) // there is no API call to upsert a Contact and also remove them from a list at the same time, so we need to do these operations separately
}

function validate(payloads: IndexedPayload[], invalidEmails?: string[]) {
  if (payloads[0].external_audience_id == null) {
    payloads.forEach((p) => {
      p.error = {
        errorMessage: 'external_audience_id value is missing from payload',
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        statusCode: 400
      }
    })
    return
  }

  payloads.forEach((p) => {
    validatePayload(p, invalidEmails)
  })
}

function validatePayload(payload: IndexedPayload, invalidEmails?: string[]) {

  if (payload.identifiers.email && invalidEmails?.includes(payload.identifiers.email)) {
    payload.error = {
      errorMessage: `Sendgrid rejected email '${payload.identifiers.email}' as being not valid`,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      statusCode: 400
    }
    return
  }

  if (payload.identifiers.phone_number_id && !validatePhone(payload.identifiers.phone_number_id)) {
    payload.error = {
      errorMessage: `phone_number_id '${payload.identifiers.phone_number_id}' is not valid`,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      statusCode: 400
    }
    return
  }

  if (payload.user_attributes?.phone_number && !validatePhone(payload.user_attributes.phone_number)) {
    payload.error = {
      errorMessage: `user_attributes.phone_number '${payload.user_attributes.phone_number}' is not valid`,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      statusCode: 400
    }
    return
  }

  for (const [key, value] of Object.entries(payload.custom_text_fields ?? {})) {
    if (typeof value !== 'string') {
      payload.error = {
        errorMessage: `custom_text_fields ${key} value ${value} is not a string`,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        statusCode: 400
      }
      return
    }
  }

  for (const [key, value] of Object.entries(payload.custom_number_fields ?? {})) {
    if (typeof value !== 'number') {
      payload.error = {
        errorMessage: `custom_number_fields ${key} value ${value} is not a number`,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        statusCode: 400
      }
      return
    }
  }

  if (payload.custom_date_fields) {
    for (const [key, value] of Object.entries(payload.custom_date_fields)) {
      if (typeof value !== 'string') {
        payload.error = {
          errorMessage: `custom_number_fields ${key} value ${value} is not a string`,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          statusCode: 400
        }
        return
      } else {
        const date = toDateFormat(value)
        if (date === undefined) {
          payload.error = {
            errorMessage: `custom_date_fields ${key} value ${value} is not a valid date`,
            errortype: 'PAYLOAD_VALIDATION_FAILED',
            statusCode: 400
          }
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
    payload.error = {
      errorMessage: 'At least one identifier from Email Address, Phone Number ID, Anonymous ID or External ID is required.',
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      statusCode: 400
    }
    return
  }
}

async function upsertContacts(request: RequestClient, payloads: IndexedPayload[], action: Action){

  const assignUnknwonErrors = (payloads: IndexedPayload[], status: number, action: Action) => {
    payloads
      .filter((p) => p.action === action)
      .forEach((p) => {
        p.error = {
          errorMessage: 'Error occurred while upserting this contact to Sendgrid',
          errortype: ErrorCodes.UNKNOWN_ERROR,
          statusCode: status,
        }
      })
  }

  try {
    const json = upsertJSON(payloads, action)
    if(json.contacts.length > 0) {
      await upsertRequest(request, json) // make the initial upsert request
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
          await upsertRequest(request, json2) // make second upsert request minus the bad email addresses
        }
        return 
      } catch (error) {
        assignUnknwonErrors(payloads, status, action)
        return
      }
    } 
    
    assignUnknwonErrors(payloads, status, action)
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
    
    return
  }

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

function chunkPayloads(payloads: IndexedPayload[]): IndexedPayload[][] {
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

function setRespErrorStatus(
  multiStatusResponse: MultiStatusResponse, indexes: number[], errorMessage: string, errortype: keyof typeof ErrorCodes = "PAYLOAD_VALIDATION_FAILED", status = 400) {
  for (const i of indexes) {
    multiStatusResponse.setErrorResponseAtIndex(i, {
      status,
      errortype,
      errormessage: errorMessage
    });
  }
}