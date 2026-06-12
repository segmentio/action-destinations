import { US_STATE_CODES, SCHEMA_PROPERTIES } from './constants'
import { Payload } from './generated-types'
import {
  RequestClient,
  InvalidAudienceMembershipError,
  IntegrationError,
  MultiStatusResponse,
  ErrorCodes,
  Features
} from '@segment/actions-core'
import type { JSONLikeObject, AudienceMembership } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { processHashing } from '../../../lib/hashing-utils'
import { PayloadMap, AudienceJSON, FacebookDataRow, RawData } from './types'
import { BASE_URL } from '../constants'
import { parseFacebookError, getApiVersion } from '../functions'
import { FacebookResponseError } from '../types'

/*
 * If events contain computation_class === 'journey_step' the payloads may be for JourneysV1. 
 * journeysV1 always adds users to the audience. 
 */
export function getJourneysV1Memberships(rawDatas: RawData[] | undefined): boolean[] | undefined {
  if (!rawDatas || (Array.isArray(rawDatas) && rawDatas.length === 0)) {
    return undefined
  }

  const isJourneyStep = rawDatas.map((raw) => raw?.context?.personas?.computation_class === 'journey_step')
  const allJourney = isJourneyStep.every(Boolean)
  const noneJourney = isJourneyStep.every((v) => !v)

  if (!allJourney && !noneJourney) {
    throw new InvalidAudienceMembershipError(
      'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    )
  }

  if (noneJourney) {
    return undefined
  }

  return new Array(rawDatas.length).fill(true)
}

export async function send(
  request: RequestClient,
  payloads: Payload[],
  isBatch: boolean,
  audienceMemberships?: AudienceMembership[],
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
  features?: Features,
  statsContext?: StatsContext,
  rawData?: RawData[]
): Promise<MultiStatusResponse | void> {
  const msResponse = new MultiStatusResponse()

  // getJourneysV1Memberships also throws if the batch mixes journey_step and non-journey_step events.
  const isJourney = getJourneysV1Memberships(rawData) !== undefined
  if (isJourney && !audienceMemberships?.every((m) => typeof m === 'boolean')) {
    // If audienceMemberships is already populated with booleans we assume JourneysV2 (which can add
    // AND remove users), so we leave it untouched. Otherwise we assume JourneysV1 (which only adds)
    // and set all memberships to true.
    //
    // NOTE: the membership array is sized to `payloads`, NOT to `rawData`. `rawData` is the full,
    // unfiltered batch, but invalid payloads are dropped before they reach here — so `payloads` may
    // be shorter. Building the array from `payloads.length` keeps it aligned and avoids a spurious
    // "Audience membership details count does not match batch payload count." error that would fail
    // the whole batch when one event was filtered out.
    audienceMemberships = new Array(payloads.length).fill(true)
  }

  const audienceId = getAudienceId(payloads[0], hookOutputs)
  const errorMessage = validate(payloads, audienceId, audienceMemberships)

  if (errorMessage) {
    return returnErrorResponse(msResponse, payloads, isBatch, errorMessage, ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP)
  }

  const addMap: PayloadMap = new Map<number, Payload>()
  const deleteMap: PayloadMap = new Map<number, Payload>()

  payloads.forEach((payload, index) => {
    const audienceMembership = audienceMemberships?.[index]
    if (audienceMembership === false) {
      deleteMap.set(index, payload)
    } else if (audienceMembership === true) {
      addMap.set(index, payload)
    } else if (audienceMembership === undefined) {
      setErrorResponse(
        msResponse,
        payload,
        400,
        index,
        isBatch,
        'Audience membership details missing',
        ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP
      )
    }
  })

  const requests: Promise<void>[] = []

  if (addMap.size > 0) {
    requests.push(sendRequest(request, audienceId, addMap, msResponse, 'POST', isBatch, features, statsContext))
  }

  if (deleteMap.size > 0) {
    requests.push(sendRequest(request, audienceId, deleteMap, msResponse, 'DELETE', isBatch, features, statsContext))
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }
}

export async function sendRequest(
  request: RequestClient,
  audienceId: string,
  map: PayloadMap,
  msResponse: MultiStatusResponse,
  method: 'POST' | 'DELETE',
  isBatch: boolean,
  features?: Features,
  statsContext?: StatsContext
): Promise<void> {
  const indices = Array.from(map.keys())
  const payloads = Array.from(map.values())
  const json = getJSON(payloads)

  try {
    await request(`${BASE_URL}/${getApiVersion(features, statsContext)}/${audienceId}/users`, {
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
    const { message, code, status } = parseFacebookError(error as FacebookResponseError)

    for (let i = 0; i < indices.length; i++) {
      const sent: JSONLikeObject = {
        data: json.payload.data[i],
        method,
        audienceId
      }
      setErrorResponse(msResponse, payloads[i], status, indices[i], isBatch, message, code, sent)
    }
  }
}

export function setErrorResponse(
  msResponse: MultiStatusResponse,
  payload: Payload,
  status: number,
  index: number,
  isBatch: boolean,
  errormessage: string,
  errortype: keyof typeof ErrorCodes | string,
  sent?: JSONLikeObject
) {
  if (!isBatch) {
    if (errortype === ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP) {
      throw new InvalidAudienceMembershipError(errormessage)
    }
    throw new IntegrationError(errormessage, errortype, status)
  }
  msResponse.setErrorResponseAtIndex(index, {
    status,
    errortype: errortype as keyof typeof ErrorCodes,
    errormessage,
    body: payload as unknown as JSONLikeObject,
    ...(sent ? { sent } : {})
  })
}

export function returnErrorResponse(
  msResponse: MultiStatusResponse,
  payloads: Payload[],
  isBatch: boolean,
  errormessage: string,
  errortype: keyof typeof ErrorCodes
): MultiStatusResponse {
  payloads.forEach((payload, i) => {
    setErrorResponse(msResponse, payload, 400, i, isBatch, errormessage, errortype)
  })
  return msResponse
}

export function getAudienceId(
  payload: Payload,
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } }
): string {
  const { retlOnMappingSave: { outputs: { audienceId: hookAudienceId = undefined } = {} } = {} } = hookOutputs ?? {}
  const { external_audience_id: payloadAudienceId } = payload
  return (hookAudienceId ?? payloadAudienceId) as string
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

export function validate(
  payloads: Payload[],
  audienceId: unknown,
  audienceMemberships?: AudienceMembership[]
): string | undefined {
  if (!Array.isArray(audienceMemberships)) {
    return 'Audience membership details for batch missing.'
  }

  if (Array.isArray(audienceMemberships) && audienceMemberships.length !== payloads.length) {
    return 'Audience membership details count does not match batch payload count.'
  }

  if (!audienceId || typeof audienceId !== 'string') {
    return 'Missing audience ID.'
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
