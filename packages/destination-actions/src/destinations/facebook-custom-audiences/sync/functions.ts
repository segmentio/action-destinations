import { US_STATE_CODES, SCHEMA_PROPERTIES } from './constants'
import { Payload } from './generated-types'
import { RequestClient, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import { AudienceJSON, FacebookDataRow } from './types'
import { API_VERSION, BASE_URL } from '../constants'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
  syncMode?: string
) {
  const { 
    retlOnMappingSave: { 
      outputs: { 
        audienceId: hookAudienceId 
      } = {} 
    } = {} 
  } = hookOutputs ?? {}
  
  const { 
    computation_class, 
    audience_key,
    traits_or_properties, 
    external_audience_id: payloadAudienceId 
  } = payloads[0]

  const audienceId = hookAudienceId ?? payloadAudienceId
  
  const isEngageAudience = typeof traits_or_properties === 'object' && audience_key && computation_class && ['audience', 'journey_step'].includes(computation_class) ? true : false
  
  const hasSyncMode = typeof syncMode === 'string' && ['upsert', 'delete'].includes(syncMode) ? true : false

  validate(audienceId, isEngageAudience, hasSyncMode)
  
  let deletePayloads: Payload[] = []
  let addPayloads: Payload[] = []

  if (!isEngageAudience) {
    syncMode === 'delete' ? deletePayloads = [...payloads] : addPayloads = [...payloads]
  } 
  else {
    payloads.forEach((payload) => {
      const { 
        traits_or_properties,
        audience_key       
      } = payload
    
      const isAudienceMember = traits_or_properties && typeof audience_key === 'string' && traits_or_properties[audience_key] === true

      if (isAudienceMember) {
        addPayloads.push(payload)
      } 
      else {
        deletePayloads.push(payload)
      }
    })
  }

  const requests = []

  if (addPayloads.length > 0) {
    requests.push(
      request(`${BASE_URL}/${API_VERSION}/${audienceId}/users`, {
        method: 'POST',
        json: getJSON(addPayloads)
      })
    )
  }

  if (deletePayloads.length > 0) {
    requests.push(
      request(`${BASE_URL}/${API_VERSION}/${audienceId}/users`, {
        method: 'DELETE',
        json: getJSON(deletePayloads)
      })
    )
  }

  return await Promise.all(requests)
}

function getJSON(payloads: Payload[]): AudienceJSON {
  const data = getData(payloads)
  const app_ids: string[] = []
  const page_ids: string[] = []
  
  payloads.forEach((payload) => {
    const { appId, pageId } = payload
    app_ids.push(typeof appId === 'string' && appId ? appId : '')
    page_ids.push(typeof pageId === 'string' && pageId ? pageId : '')
  })

  return {
    payload: {
      schema: SCHEMA_PROPERTIES,
      data,
      ...(app_ids?.some((id) => id?.trim() !== '') ? { app_ids } : {}),
      ...(page_ids?.some((id) => id?.trim() !== '') ? { page_ids } : {})
    }
  }
}

function validate(audienceId: unknown, isEngageAudience: boolean, hasSyncMode: boolean) {
  if (!audienceId || typeof audienceId !== 'string') {
    throw new PayloadValidationError(
      'Missing audience ID.'
    )
  }

  if (!isEngageAudience && !hasSyncMode) {
    throw new IntegrationError('Audience payloads should have a Sync mode value, or should be sent from Engage', 'MISSING_REQUIRED_FIELD', 400)
  }
} 

export function getData(payloads: Payload[]): FacebookDataRow[]{
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
      phone ? processHashing(phone,  'sha256', 'hex', normalizePhone) ?? '' : '',
      year ? processHashing(year.trim(), 'sha256', 'hex')  ?? '' : '',
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

function normalizePhone(value: string): string {
  const removedNonNumveric = value.replace(/\D/g, '')

  return removedNonNumveric.replace(/^0+/, '')
}

function normalizeGender(value: string): string {
  const lowerCaseValue = value.toLowerCase().trim()

  if (['male', 'boy', 'm'].includes(lowerCaseValue)) return 'm'
  if (['female', 'woman', 'girl', 'f'].includes(lowerCaseValue)) return 'f'

  return value
}

function normalizeMonth(value: string): string {
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

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\p{P}/gu, '')
}

function normalizeCity(value: string): string {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}

function normalizeState(value: string): string {
  if (US_STATE_CODES.has(value.toLowerCase().trim())) {
    return US_STATE_CODES.get(value.toLowerCase().trim()) as string
  }

  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}

function normalizeZip(value: string): string {
  if (value.includes('-')) {
    return value.split('-')[0]
  }

  return value.trim().replace(/\s/g, '').toLowerCase()
}

function normalizeCountry(value: string): string {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}
