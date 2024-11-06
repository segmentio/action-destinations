import { RequestClient } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { UPSERT_CONTACTS_URL } from '../constants'

export async function send(request: RequestClient, payload: Payload) {
  validate(payload)

  const json: UpsertContactsReq = {
    
  }

  return await request(UPSERT_CONTACTS_URL, {
    method: 'post',
    json
  })
}

function validate(payload: Payload) {
  return
}
