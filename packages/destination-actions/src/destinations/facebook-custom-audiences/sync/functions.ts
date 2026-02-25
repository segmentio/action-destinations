import { US_STATE_CODES, SCHEMA_PROPERTIES } from './constants'
import { Payload } from './generated-types'
import { RequestClient, PayloadValidationError, IntegrationError, MultiStatusResponse } from '@segment/actions-core'
import type { JSONLikeObject } from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import { AudienceJSON, FacebookDataRow, SyncMode } from './types'
import { API_VERSION, BASE_URL } from '../constants'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  isBatch: boolean,
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
  syncMode?: string
) {
  const msResponse = new MultiStatusResponse()
  const audienceId = getAudienceId(payloads[0], hookOutputs)
  const isEngage = isEngageAudience(payloads[0])
  const errorMessage = validate(audienceId, isEngage, syncMode as SyncMode | undefined)

  if (errorMessage) {
    return returnErrorResponse(msResponse, payloads, isBatch, errorMessage)
  }

  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  if(syncMode === 'delete') {
    payloads.forEach((payload, index) => deleteMap.set(index, payload))
  } 
  else if (syncMode === 'upsert') {
    payloads.forEach((payload, index) => addMap.set(index, payload))
  } 
  else if (syncMode === 'mirror') {
    
    if(!isEngage) {
      const error = 'Sync mode set to "Mirror", but payload is not from Engage. Please ensure payloads are sent from Engage when using "Mirror" sync mode.'
      return returnErrorResponse(msResponse, payloads, isBatch, error)
    }

    payloads.forEach((payload, index) => {
      const { engage_fields: { traits_or_properties, audience_key } = {} } = payload

      const isAudienceMember =
        traits_or_properties && typeof audience_key === 'string' && traits_or_properties[audience_key] === true

      if (isAudienceMember) {
        addMap.set(index, payload)
      } else {
        deleteMap.set(index, payload)
      }
    })
  }

  const requests: Promise<void>[] = []

  if (addMap.size > 0) {
    requests.push(sendRequest(request, audienceId, addMap, msResponse, 'POST', isBatch))
  }

  if (deleteMap.size > 0) {
    requests.push(sendRequest(request, audienceId, deleteMap, msResponse, 'DELETE', isBatch))
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }
}

export async function sendRequest(
  request: RequestClient,
  audienceId: string,
  map: Map<number, Payload>,
  msResponse: MultiStatusResponse,
  method: 'POST' | 'DELETE',
  isBatch: boolean
): Promise<void> {
  const indices = Array.from(map.keys())
  const payloads = Array.from(map.values())
  const json = getJSON(payloads)

  try {
    await request(`${BASE_URL}/${API_VERSION}/${audienceId}/users`, {
      method,
      json
    })
    for (let i = 0; i < indices.length; i++) {
      const originalIndex = indices[i]
      msResponse.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
        body: payloads[i] as unknown as JSONLikeObject,
        sent: {
          data: json.payload.data[i],
          method,
          audienceId
        }
      })
    }
  } catch (error) {
    const {
      response: {
        status = 500,
        data: {
          error: {
            message: facebookMessage = undefined,
            code: errorCode = 400,
            type: errorType = 'FACEBOOK_API_ERROR'
          } = {}
        } = {}
      } = {},
      message: genericMessage
    } = error || {}

    const message = facebookMessage || genericMessage || 'Unknown error'
    const errorMessage: string = errorCode ? `${message} (code: ${errorCode})` : message

    if (!isBatch) {
      throw new IntegrationError(errorMessage, errorType as string, errorCode as number)
    }

    for (let i = 0; i < indices.length; i++) {
      const originalIndex = indices[i]
      msResponse.setErrorResponseAtIndex(originalIndex, {
        status,
        errortype: errorType,
        errormessage: errorMessage,
        body: payloads[i] as unknown as JSONLikeObject,
        sent: {
          data: json.payload.data[i],
          method,
          audienceId
        }
      })
    }
  }
}

export function returnErrorResponse(
  msResponse: MultiStatusResponse,
  payloads: Payload[],
  isBatch: boolean,
  errorMessage: string
): MultiStatusResponse {
  if (isBatch) {
    payloads.forEach((payload, i) => {
      msResponse.setErrorResponseAtIndex(i, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: errorMessage,
        body: payload as unknown as JSONLikeObject
      })
    })
    return msResponse
  } else {
    throw new PayloadValidationError(errorMessage)
  }
}

export function getAudienceId(
  payload: Payload,
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } }
): string {
  const { retlOnMappingSave: { outputs: { audienceId: hookAudienceId = undefined } = {} } = {} } = hookOutputs ?? {}

  const { external_audience_id: payloadAudienceId } = payload

  return (hookAudienceId ?? payloadAudienceId) as string
}

export function isEngageAudience(payload: Payload): boolean {
  const { engage_fields: { computation_class, audience_key, traits_or_properties } = {} } = payload

  return typeof traits_or_properties === 'object' &&
    audience_key &&
    computation_class &&
    ['audience', 'journey_step'].includes(computation_class)
    ? true
    : false
}

export function getJSON(payloads: Payload[]): AudienceJSON {
  const data = getData(payloads)
  const app_ids: string[] = []
  const page_ids: string[] = []
  const ig_account_ids: string[] = []

  payloads.forEach((payload) => {
    const { appId, pageId, igAccountIds } = payload
    app_ids.push(typeof appId === 'string' && appId ? appId : '')
    page_ids.push(typeof pageId === 'string' && pageId ? pageId : '')
    ig_account_ids.push(typeof igAccountIds === 'string' && igAccountIds ? igAccountIds : '')
  })

  return {
    payload: {
      schema: SCHEMA_PROPERTIES,
      data,
      ...(app_ids?.some((id) => id?.trim() !== '') ? { app_ids } : {}),
      ...(page_ids?.some((id) => id?.trim() !== '') ? { page_ids } : {}),
      ...(ig_account_ids?.some((id) => id?.trim() !== '') ? { ig_account_ids } : {})
    }
  }
}

export function validate(audienceId: unknown, isEngageAudience: boolean, syncMode?: SyncMode): string | undefined {
 
  if (!audienceId || typeof audienceId !== 'string') {
    return 'Missing audience ID.'
  }

  if (syncMode === 'mirror' && !isEngageAudience) {
    return 'Sync Mode set to "Mirror", but payload is not from Engage. Please ensure payloads are sent from Engage when using "Mirror" sync mode.'
  }

  if (typeof syncMode !== 'string' || !['upsert', 'delete', 'mirror'].includes(syncMode)) {
    return 'Sync Mode is required and must be one of the following values: "Mirror", "Upsert", or "Delete".'
  }
}

export function getData(payloads: Payload[]): FacebookDataRow[] {
  const data: FacebookDataRow[] = new Array(payloads.length)

  payloads.forEach((payload, index) => {
    const {
      externalId,
      email,
      phone,
      birth: { year, month, day } = {},
      name: { last, first, firstInitial } = {},
      gender,
      city,
      state,
      zip,
      country,
      mobileAdId
    } = payload

    const row: FacebookDataRow = [
      externalId ?? '',
      email ? processHashing(email.trim().toLowerCase(), 'sha256', 'hex') : '',
      phone ? processHashing(phone, 'sha256', 'hex', normalizePhone) ?? '' : '',
      year ? processHashing(year.trim(), 'sha256', 'hex') ?? '' : '',
      month ? processHashing(normalizeMonth(month), 'sha256', 'hex') ?? '' : '',
      day ? processHashing(day.trim(), 'sha256', 'hex') ?? '' : '',
      last ? processHashing(normalizeName(last), 'sha256', 'hex') ?? '' : '',
      first ? processHashing(normalizeName(first), 'sha256', 'hex') ?? '' : '',
      firstInitial ? processHashing(firstInitial.trim().toLowerCase(), 'sha256', 'hex') ?? '' : '',
      gender ? processHashing(normalizeGender(gender), 'sha256', 'hex') ?? '' : '',
      city ? processHashing(normalizeCity(city), 'sha256', 'hex') ?? '' : '',
      state ? processHashing(normalizeState(state), 'sha256', 'hex') ?? '' : '',
      zip ? processHashing(normalizeZip(zip), 'sha256', 'hex') ?? '' : '',
      country ? processHashing(normalizeCountry(country), 'sha256', 'hex') ?? '' : '',
      mobileAdId ?? ''
    ]

    data[index] = row
  })

  return data
}

export function normalizePhone(value: string): string {
  const removedNonNumveric = value.replace(/\D/g, '')

  return removedNonNumveric.replace(/^0+/, '')
}

export function normalizeGender(value: string): string {
  const lowerCaseValue = value.toLowerCase().trim()

  if (['male', 'boy', 'm'].includes(lowerCaseValue)) return 'm'
  if (['female', 'woman', 'girl', 'f'].includes(lowerCaseValue)) return 'f'

  return value
}

export function normalizeMonth(value: string): string {
  const normalizedValue = value.replace(/\s/g, '').trim()

  if (normalizedValue.length === 2 && typeof Number(normalizedValue) === 'number') {
    return normalizedValue
  }

  const lowerCaseValue = value.trim().toLowerCase()
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
  ]
  const monthIndex = months.indexOf(lowerCaseValue)

  if (monthIndex === -1) {
    return value
  }

  if (monthIndex < 9) {
    return `0${monthIndex + 1}`
  }

  return `${monthIndex + 1}`
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\p{P}/gu, '')
}

export function normalizeCity(value: string): string {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}

export function normalizeState(value: string): string {
  if (US_STATE_CODES.has(value.toLowerCase().trim())) {
    return US_STATE_CODES.get(value.toLowerCase().trim()) as string
  }

  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}

export function normalizeZip(value: string): string {
  if (value.includes('-')) {
    return value.split('-')[0]
  }

  return value.trim().replace(/\s/g, '').toLowerCase()
}

export function normalizeCountry(value: string): string {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}
