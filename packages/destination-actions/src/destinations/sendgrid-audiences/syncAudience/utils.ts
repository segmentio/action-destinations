import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { UPSERT_CONTACTS_URL, REMOVE_CONTACTS_FROM_LIST_URL, GET_CONTACT_BY_EMAIL_URL } from '../constants'
import { UpsertContactsReq, GetContactsByEmailReq, GetContactsByEmailResp } from '../types'

export async function send(request: RequestClient, payload: Payload[]) {
  payload.map(validate)

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
        email: payload.primary_email
      })) as UpsertContactsReq['contacts']
    }   
    await request(UPSERT_CONTACTS_URL, {
      method: 'put',
      json
    })
  }

  if(remove.length>0) {
    const list_id = remove[0].external_audience_id 

    const emails: GetContactsByEmailReq = {
      emails: payload.map((item) => item.primary_email)
    }

    const response = await request<GetContactsByEmailResp>(GET_CONTACT_BY_EMAIL_URL, {
      method: 'post',
      json: emails
    })

    const contact_ids = Object.values(response.data.result)
      .filter(item => item.contact.list_ids.includes(list_id))
      .map(item => item.contact.id)
  
    const url = REMOVE_CONTACTS_FROM_LIST_URL.replace('{list_id}', remove[0].external_audience_id).replace('{contact_ids}', contact_ids.join(','))

    if(contact_ids.length>0){
      await request(url, {
        method: 'delete'
      })
    }
  }
}

function validate(payload: Payload) {
  if(payload.external_audience_id == null) {
    throw new PayloadValidationError('external_audience_id value is missing from payload')
  }
}
