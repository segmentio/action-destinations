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
        (isAdd ? acc.addEmail.opPayloads : acc.removeEmail.opPayloads).push(p)
      }
      if (p.phone) {
        (isAdd ? acc.addPhone.opPayloads : acc.removePhone.opPayloads).push(p)
      }
      if (p.advertising_id) {
        (isAdd ? acc.addMAID.opPayloads : acc.removeMAID.opPayloads).push(p)
      }

      return acc
    },
    {
      addEmail: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.EMAIL } as OperationType },
      addPhone: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.PHONE } as OperationType },
      addMAID: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'POST', type: SCHEMA_TYPES.MAID } as OperationType },
      removeEmail: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.EMAIL } as OperationType },
      removePhone: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.PHONE } as OperationType },
      removeMAID: { opPayloads: [] as PayloadWithIndex[], operationType: { method: 'DELETE', type: SCHEMA_TYPES.MAID } as OperationType },
    }
  )

  const url = `https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`
  await Promise.all(Object.entries(batches)
    .filter(([, batch]) => batch.opPayloads.length > 0)
    .map(async ([, batch]) => {
      const { opPayloads, operationType: { type, method } } = batch
      const json = buildJSON(opPayloads, type)
      try {
        await request(url, { method, json })
        opPayloads.forEach((p) => {
          const existingResponse = multiStatusResponse.getResponseAtIndex(p.index)?.value()
          const status = existingResponse?.status
          if (typeof status === 'number' && (status < 200 || status >= 300)) {
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
        for (const p of opPayloads) {
          // Snap doesn't provide statuses for individual items in the batch. So if request fails, we mark all items in the batch as failed
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

  const seen = new Set<string>()

  const data: [string][] = payloads.reduce<[string][]>((acc, p) => {
    let value: string | undefined

    if (type === SCHEMA_TYPES.EMAIL && p.email) {
      value = processHashing(p.email, 'sha256', 'hex', normalize)
    } else if (type === SCHEMA_TYPES.PHONE && p.phone) { 
      value = processHashing(p.phone, 'sha256', 'hex', normalizePhone)
    } else if (type === SCHEMA_TYPES.MAID && p.advertising_id) { 
      value = processHashing(p.advertising_id, 'sha256', 'hex', normalize)
    }

    if (value && !seen.has(value)) {
        // Make sure to never send duplicate identifiers in the same batch
      seen.add(value)
      acc.push([value])
    }

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
