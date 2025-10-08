import type { Payload } from './generated-types'
import { processHashing } from '../../../lib/hashing-utils'
import { RequestClient, MultiStatusResponse } from '@segment/actions-core'
import { PayloadWithIndex, AddRemoveUsersJSON, SchemaType } from './types'
import { SCHEMA_TYPES } from './constants'


export async function send(request: RequestClient, payload: Payload[]) {
  const payloads: PayloadWithIndex[] = payload.map((p, index) => ({ ...p, index }))
  const { external_audience_id } = payload[0]
  const multiStatusResponse = new MultiStatusResponse()
  
  const grouped = payloads.reduce(
    (acc, p) => {
      const hasValue = Boolean(p.email || p.phone || p.advertising_id)
      if (!hasValue) {
        multiStatusResponse.setErrorResponseAtIndex(p.index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'One of "email" or "phone" or "Mobile Advertising ID" is required.'
        });
        return acc
      }

      const isAdd = Boolean(p.props[p.audienceKey])
      
      if (p.email) (isAdd ? acc.addEmail : acc.removeEmail).push(p)
      if (p.phone) (isAdd ? acc.addPhone : acc.removePhone).push(p)
      if (p.advertising_id) (isAdd ? acc.addMAID : acc.removeMAID).push(p)

      return acc
    },
    {
      addEmail: [] as PayloadWithIndex[],
      addPhone: [] as PayloadWithIndex[],
      addMAID: [] as PayloadWithIndex[],
      removeEmail: [] as PayloadWithIndex[],
      removePhone: [] as PayloadWithIndex[],
      removeMAID: [] as PayloadWithIndex[],
    }
  )

  const url = `https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`

  return await Promise.all([
    sendRequest(request, grouped.addEmail, SCHEMA_TYPES.EMAIL, "POST", url),
    sendRequest(request, grouped.addPhone, SCHEMA_TYPES.PHONE, "POST", url),
    sendRequest(request, grouped.addMAID, SCHEMA_TYPES.MAID, "POST", url),
    sendRequest(request, grouped.removeEmail, SCHEMA_TYPES.EMAIL, "DELETE", url),
    sendRequest(request, grouped.removePhone, SCHEMA_TYPES.PHONE, "DELETE", url),
    sendRequest(request, grouped.removeMAID, SCHEMA_TYPES.MAID, "DELETE", url)
  ])

}

async function sendRequest(request: RequestClient, payloads: PayloadWithIndex[], type: SchemaType, method: "POST" | "DELETE", url: string) {
  if (payloads.length === 0) return { skipped: true }

  const json = buildJSON(payloads, type)
  return await request(url, { method, json })
}

function buildJSON(payloads: PayloadWithIndex[], type: SchemaType): AddRemoveUsersJSON {
  const data: [string][] = payloads.reduce<[string][]>((acc, p) => {
    let value: string | undefined;
    if (type === SCHEMA_TYPES.EMAIL && p.email) value = processHashing(p.email, 'sha256', 'hex', normalize);
    else if (type === SCHEMA_TYPES.PHONE && p.phone) value = processHashing(p.phone, 'sha256', 'hex', normalizePhone);
    else if (type === SCHEMA_TYPES.MAID && p.advertising_id) value = processHashing(p.advertising_id, 'sha256', 'hex', normalize);

    if (value) acc.push([value])
    return acc
  }, [])

  return {
    users: [
      {
        schema: [type],
        data
      }
    ]
  }
}

export const normalize = (identifier: string): string => {
  return identifier.trim().toLowerCase()
}

/*
  Normalize phone numbers by
  - removing any double 0 in front of the country code
  - if the number itself begins with a 0 this should be removed
  - Also exclude any non-numeric characters such as whitespace, parentheses, '+', or '-'.
*/
export const normalizePhone = (phone: string): string => {
  // Remove non-numeric characters and parentheses, '+', '-', ' '
  let normalizedPhone = phone.replace(/[\s()+-]/g, '')

  // Remove leading "00" if present
  if (normalizedPhone.startsWith('00')) {
    normalizedPhone = normalizedPhone.substring(2)
  }

  // Remove leading zero if present (for local numbers)
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = normalizedPhone.substring(1)
  }

  return normalizedPhone
}
