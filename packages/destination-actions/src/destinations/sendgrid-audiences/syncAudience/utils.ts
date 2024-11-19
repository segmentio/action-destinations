import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import {
  UPSERT_CONTACTS_URL,
  SEARCH_CONTACTS_URL,
  REMOVE_CONTACTS_FROM_LIST_URL,
  MAX_CHUNK_SIZE_SEARCH,
  MAX_CHUNK_SIZE_REMOVE
} from '../constants'
import { UpsertContactsReq, SearchContactsResp, AddRespError } from '../types'
import chunk from 'lodash/chunk'

export async function send(request: RequestClient, payload: Payload[]) {
  const ignoreErrors = payload.length > 1

  const payloads = validate(payload, ignoreErrors)

  if (payloads.length === 0) {
    throw new PayloadValidationError('No valid payloads found')
  }

  const { add, remove } = ((payloads: Payload[]) =>
    payloads.reduce<{ add: Payload[]; remove: Payload[] }>(
      (acc, payload) => {
        acc[payload.traits_or_props[payload.segment_audience_key] ? 'add' : 'remove'].push(payload)
        return acc
      },
      { add: [], remove: [] }
    ))(payloads)

  if (add.length > 0) {
    try {
      await sendRequest(request, add)
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
      const add2 = validate(add, true, invalidEmails)
      if (add2.length > 0) {
        await sendRequest(request, add2)
      }
    }
  }

  if (remove.length > 0) {
    const identifiers: (keyof Payload)[] = ['email', 'phone_number_id', 'external_id', 'anonymous_id']

    const chunks = chunkPayloads(remove)

    const queries = chunks.map((c) =>
      identifiers
        .map((identifier) => getQueryPart(identifier, c))
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

    const listId = remove[0].external_audience_id

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
}

function validate(payloads: Payload[], ignoreErrors: boolean, invalidEmails?: string[]): Payload[] {
  if (payloads[0].external_audience_id == null) {
    throw new PayloadValidationError('external_audience_id value is missing from payload')
  }
  const validPayloads = payloads.filter((p) => {
    if (p.email && invalidEmails?.includes(p.email)) {
      delete p.email
    }

    if (p.custom_fields) {
      p.custom_fields = Object.fromEntries(
        Object.entries(p.custom_fields).filter(([_, value]) => typeof value === 'string' || typeof value === 'number')
      )
    }

    if (p.user_attributes) {
      p.user_attributes = Object.fromEntries(
        Object.entries(p.user_attributes ?? {}).map(([key, value]) => {
          if (typeof value !== 'string') {
            return [key, String(value)]
          }
          return [key, value]
        })
      );
    }

    const hasRequiredField = [p.email, p.anonymous_id, p.external_id, p.phone_number_id].some(Boolean)
    if (!hasRequiredField && !ignoreErrors) {
      throw new PayloadValidationError(
        'At least one of email, anonymous_id, external_id or phone_number_id is required'
      )
    }
    return hasRequiredField
  })
  return validPayloads
}

async function sendRequest(request: RequestClient, payloads: Payload[]) {
  const json = createPayload(payloads, payloads[0].external_audience_id)
  return await request(UPSERT_CONTACTS_URL, {
    method: 'put',
    json
  })
}

function createPayload(payloads: Payload[], externalAudienceId: string): UpsertContactsReq {
  const json: UpsertContactsReq = {
    list_ids: [externalAudienceId],
    contacts: payloads.map((payload) => ({
      email: payload.email ?? undefined,
      phone_number_id: payload.phone_number_id ?? undefined,
      external_id: payload.external_id ?? undefined,
      anonymous_id: payload.anonymous_id ?? undefined,
      ...payload.user_attributes,
      custom_fields: payload.custom_fields && Object.keys(payload.custom_fields).length > 0
      ? payload.custom_fields
      : undefined
    })) as UpsertContactsReq['contacts']
  }

  return json
}

function chunkPayloads(payloads: Payload[]): Payload[][] {
  const chunks: Payload[][] = []
  let currentChunk: Payload[] = []
  let currentChunkSize = 0

  for (const payload of payloads) {
    const idCount = [payload.email, payload.phone_number_id, payload.external_id, payload.anonymous_id].filter(
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

function getQueryPart(identifier: keyof Payload, payloads: Payload[]): string {
  const values = payloads
    .filter((payload) => payload[identifier] !== undefined && payload[identifier] !== null)
    .map((payload) => payload[identifier])

  const part = values.length > 0 ? `${identifier} IN (${values.map((value) => `'${value}'`).join(',')})` : ''
  return part
}
