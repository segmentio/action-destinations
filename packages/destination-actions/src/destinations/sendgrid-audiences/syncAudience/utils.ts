import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { UPSERT_CONTACTS_URL, SEARCH_CONTACTS_URL, REMOVE_CONTACTS_FROM_LIST_URL } from '../constants'
import { UpsertContactsReq, SearchContactsResp } from '../types'

export async function send(request: RequestClient, payload: Payload[]) {
  payload.map((item) => validate(item, payload.length > 1))

  const { add, remove } = ((payloads: Payload[]) => 
    payloads.reduce<{ add: Payload[]; remove: Payload[] }>(
      (acc, payload) => {
        acc[payload.traits_or_props[payload.segment_audience_key] ? 'add' : 'remove'].push(payload)
        return acc
      },
      { add: [], remove: [] }
    )
  )(payload)
  
  if(add.length>0) {
    const json: UpsertContactsReq = {
      list_ids: [add[0].external_audience_id],
      contacts: add.map((payload) => ({
        email: payload.email
      })) as UpsertContactsReq['contacts']
    }   
    await request(UPSERT_CONTACTS_URL, {
      method: 'put',
      json
    })
  }

  if(remove.length>0) {
    const identifiers: (keyof Payload)[] = ['email', 'phone_number_id', 'external_id', 'anonymous_id']

    const query = identifiers
      .map((identifier) => getQueryPart(identifier, remove))
      .filter((query) => query !== "")    
      .join(' OR ')

    const response = await request<SearchContactsResp>(SEARCH_CONTACTS_URL, {
      method: 'post',
      json: {
        query
      }
    })

    const contact_ids = response.data.result.map(item => item.id)

    const url = REMOVE_CONTACTS_FROM_LIST_URL.replace('{list_id}', remove[0].external_audience_id).replace('{contact_ids}', contact_ids.join(','))

    if(contact_ids.length>0){
      await request(url, {
        method: 'delete'
      })
    }
  }
}

function getQueryPart(identifier: keyof Payload, payloads: Payload[]): string {
  const values = payloads
    .filter((payload) => payload[identifier] !== undefined && payload[identifier] !== null)
    .map((payload) => payload[identifier])

  const part = values.length>0 ? `${identifier} IN (${values.map((value) => `'${value}'`).join(',')})` : ""
  return part
}

function validate(payload: Payload, isBatch: boolean) {
  if(payload.external_audience_id == null) {
    throw new PayloadValidationError('external_audience_id value is missing from payload')
  }

  if(!isBatch && !payload.email && !payload.anonymous_id && !payload.external_id && !payload.phone_number_id) {
    throw new PayloadValidationError('At least one of email, anonymous_id, external_id or phone_number_id is required')
  }
}
