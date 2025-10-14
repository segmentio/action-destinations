import type { Payload } from './generated-types'
import { processHashing } from '../../../lib/hashing-utils'
import { RequestClient, MultiStatusResponse } from '@segment/actions-core'
import { PayloadWithIndex, AddRemoveUsersJSON, SchemaType, OperationType } from './types'
import { SCHEMA_TYPES } from './constants'

export async function send(request: RequestClient, payload: Payload[]) {
  const payloads: PayloadWithIndex[] = payload.map((p, index) => ({ ...p, index }))
  const { external_audience_id } = payload[0]
  const multiStatusResponse = new MultiStatusResponse()
  
  const batches = payloads.reduce(
    (acc, p) => {
      const hasValue = Boolean(p.email || p.phone || p.advertising_id)
      if (!hasValue) {
        multiStatusResponse.setErrorResponseAtIndex(p.index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'One of "email" or "phone" or "Mobile Advertising ID" is required.'
        })
        return acc
      }

      const isAdd = Boolean(p.props[p.audienceKey])
      
      if (p.email) {
        (isAdd ? acc.addEmail.payloads : acc.removeEmail.payloads).push(p)
      }
      if (p.phone) {
        (isAdd ? acc.addPhone.payloads : acc.removePhone.payloads).push(p)
      }
      if (p.advertising_id) {
        (isAdd ? acc.addMAID.payloads : acc.removeMAID.payloads).push(p)
      }

      return acc
    },
    {
      addEmail: { payloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.EMAIL } as OperationType },
      addPhone: { payloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.PHONE } as OperationType },
      addMAID: { payloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.MAID } as OperationType },
      removeEmail: { payloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.EMAIL } as OperationType },
      removePhone: { payloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.PHONE } as OperationType },
      removeMAID: { payloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.MAID } as OperationType },
    }
  )

  const url = `https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`

  await Promise.all(Object.entries(batches)
    .filter(([, batch]) => batch.payloads.length > 0)
    .map(async ([, batch]) => {
      
      const { payloads, operationType: { type, method } } = batch
      const json = buildJSON(payloads, type)
      
      try {
        await request(url, { method, json })
        payloads.forEach((p) => {
          const existingResponse = multiStatusResponse.getResponseAtIndex(p.index).value()
          const status = existingResponse?.status
          if (status < 200 || status >= 300) {
            // skip, as we already have an error for this payload
            return
          }
          multiStatusResponse.setSuccessResponseAtIndex(p.index, {
            status: 200,
            sent: json.users[p.index],
            body: JSON.stringify(p)
          })
        })
      } 
      catch (error) {
        for (const p of payloads) {
          multiStatusResponse.setErrorResponseAtIndex(p.index, {
            status: error?.response?.status || 400,
            errortype: 'BAD_REQUEST',
            errormessage: error.message || 'Unknown error',
            sent: json.users[p.index],
            body: JSON.stringify(p)
          })
        }
      }
  }))

  return multiStatusResponse
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
