import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { UPSERT_CONTACTS_URL, SEARCH_CONTACTS_URL, REMOVE_CONTACTS_FROM_LIST_URL, MAX_CHUNK_SIZE_SEARCH, MAX_CHUNK_SIZE_REMOVE } from '../constants'
import { UpsertContactsReq, SearchContactsResp } from '../types'
import chunk from 'lodash/chunk'

export async function send(request: RequestClient, payload: Payload[]) {
  
  const payloads = validate(payload)

  const { add, remove } = ((payloads: Payload[]) => 
    payloads.reduce<{ add: Payload[]; remove: Payload[] }>(
      (acc, payload) => {
        acc[payload.traits_or_props[payload.segment_audience_key] ? 'add' : 'remove'].push(payload)
        return acc
      },
      { add: [], remove: [] }
    )
  )(payloads)
  
  if(add.length>0) {
    const json: UpsertContactsReq = {
      list_ids: [add[0].external_audience_id],
      contacts: add.map((payload) => ({
        email: payload.email ?? undefined,
        phone_number_id: payload.phone_number_id ?? undefined,
        external_id: payload.external_id ?? undefined,
        anonymous_id: payload.anonymous_id ?? undefined
      })) as UpsertContactsReq['contacts']
    } 
    
    await request(UPSERT_CONTACTS_URL, {
      method: 'put',
      json
    })
  }

  if(remove.length>0) {
    const identifiers: (keyof Payload)[] = ['email', 'phone_number_id', 'external_id', 'anonymous_id']

    const chunks = chunkPayloads(remove)

    const queries = chunks.map((c) =>
      identifiers
        .map((identifier) => getQueryPart(identifier, c))
        .filter((query) => query !== "")
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

    const listId = remove[0].external_audience_id

    await Promise.all(
      chunkedContactIds.map(async (c) => {
        const url = REMOVE_CONTACTS_FROM_LIST_URL.replace('{list_id}', listId).replace('{contact_ids}', c.join(','))
        if (c.length > 0) {
          await request(url, {
            method: 'delete',
          })
        }
      })
    )
  }
}

function chunkPayloads(payloads: Payload[]): Payload[][] {
  const chunks: Payload[][] = []
  let currentChunk: Payload[] = []
  let currentChunkSize = 0

  for (const payload of payloads) {
    const idCount = [payload.email, payload.phone_number_id, payload.external_id, payload.anonymous_id].filter(Boolean).length

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

function getQueryPart(identifier: keyof Payload, payloads: Payload[]): string {
  const values = payloads
    .filter((payload) => payload[identifier] !== undefined && payload[identifier] !== null)
    .map((payload) => payload[identifier])

  const part = values.length>0 ? `${identifier} IN (${values.map((value) => `'${value}'`).join(',')})` : ""
  return part
}

function validate(payloads: Payload[]): Payload[] {
  if(payloads[0].external_audience_id == null) {
    throw new PayloadValidationError('external_audience_id value is missing from payload')
  }

  const isBatch = payloads.length > 1
  
  const validPayloads = payloads.filter((p) => {
    const hasRequiredField = [p.email, p.anonymous_id, p.external_id, p.phone_number_id].some(Boolean)
    if(!hasRequiredField) {
      if(!isBatch) {
        throw new PayloadValidationError('At least one of email, anonymous_id, external_id or phone_number_id is required')
      }
      else {
        return false 
      }
    }  
    return true
  })

  if(validPayloads.length == 0) {
    throw new PayloadValidationError('No valid payloads found')
  }

  return validPayloads
}
