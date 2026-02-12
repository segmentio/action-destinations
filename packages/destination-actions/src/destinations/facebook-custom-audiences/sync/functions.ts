import { US_STATE_CODES, SCHEMA_PROPERTIES, segmentSchemaKeyToArrayIndex } from './constants'
import { Payload } from './generated-types'
import { RequestClient, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { DynamicFieldItem, DynamicFieldError } from '@segment/actions-core'
import { EmptyValueError, processHashing } from '../../../lib/hashing-utils'
import { GetAllAudienceResponse, FacebookSyncRequestParams } from './types'
import { FacebookResponseError } from '../types'
import { API_VERSION, BASE_URL } from '../constants'
import { Settings } from '../generated-types'
import { createAudience, getAudience } from '../functions'

export async function send(
  request: RequestClient,
  payload: Payload[],
  hookOutputs?: { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
  syncMode?: string
) {
  const { retlOnMappingSave: { outputs: { audienceId: hookAudienceId } = {} } = {} } = hookOutputs ?? {}
  const { external_audience_id: payloadAudienceId } = payload[0]
  const audienceId = hookAudienceId ?? payloadAudienceId

  if (!audienceId || typeof audienceId !== 'string') {
    throw new PayloadValidationError(
      'Missing audience ID. Please provide an audience ID in the payload or connect to an audience in the hook.'
    )
  }

  const deleteUsers = syncMode === 'delete' ? true : false

  if (syncMode && ['upsert', 'delete'].includes(syncMode)) {
    return await syncAudience(request, audienceId, payload, deleteUsers)
  }

  throw new IntegrationError('Sync mode is required', 'MISSING_REQUIRED_FIELD', 400)
}

export async function getAllAudiences(
  request: RequestClient,
  adAccountId: string
): Promise<{
  choices: DynamicFieldItem[]
  error?: DynamicFieldError
}> {
  const url = `${BASE_URL}/${API_VERSION}/act_${
    adAccountId.startsWith('act_') ? adAccountId.slice(4) : adAccountId
  }/customaudiences?fields=id,name&limit=200`

  try {
    const { data } = await request<GetAllAudienceResponse>(url)
    const choices = data.data.map(({ id, name }) => ({
      value: id,
      label: name
    }))
    if (choices.length > 0) {
      return {
        choices
      }
    }
    return {
      error: {
        message:
          'No custom audiences found in this ad account. Please create an audience in Facebook before connecting it to Segment.',
        code: 'NO_AUDIENCES_FOUND'
      },
      choices: []
    }
  } catch (error) {
    const err = error as FacebookResponseError
    return {
      error: {
        message: err.error.message || 'An error occurred while fetching audiences from Facebook',
        code: err.error.type || 'UNKNOWN_ERROR'
      },
      choices: []
    }
  }
}

export async function syncAudience(
  request: RequestClient,
  audienceId: string,
  payloads: Payload[],
  deleteUsers: boolean
) {
  const data = generateData(payloads)

  const app_ids: string[] = []
  let app_ids_items = 0
  payloads.forEach((payload) => {
    if (payload.appId !== undefined) {
      app_ids_items++
      app_ids.push(payload.appId)
    } else {
      app_ids.push('')
    }
  })

  const page_ids: string[] = []
  let page_ids_items = 0
  payloads.forEach((payload) => {
    if (payload.pageId !== undefined) {
      page_ids_items++
      page_ids.push(payload.pageId)
    } else {
      page_ids.push('')
    }
  })

  const params: FacebookSyncRequestParams = {
    payload: {
      schema: SCHEMA_PROPERTIES,
      data: data
    }
  }

  if (app_ids_items > 0) {
    params.payload.app_ids = app_ids
  }

  if (page_ids_items > 0) {
    params.payload.page_ids = page_ids
  }

  return await request(`${BASE_URL}/${API_VERSION}/${audienceId}/users`, {
    method: deleteUsers === true ? 'delete' : 'post',
    json: params
  })
}

export async function getExistingAudienceIdChoices(request: RequestClient, { settings }: { settings: Settings }) {
  const { retlAdAccountId } = settings
  const { choices, error } = await getAllAudiences(request, retlAdAccountId)
  if (error) {
    return { error, choices: [] }
  }
  return {
    choices
  }
}

export async function performHook(
  request: RequestClient,
  retlAdAccountId: string,
  operation?: string,
  audienceName?: string,
  existingAudienceId?: string
) {
  if (operation === 'create') {
    if (!audienceName || typeof audienceName !== 'string') {
      return {
        error: {
          message: 'Missing audience name value',
          code: 'MISSING_REQUIRED_FIELD'
        }
      }
    } else {
      const { data: { externalId } = {}, error } = await createAudience(request, audienceName, retlAdAccountId)

      if (error) {
        return { error }
      }

      return {
        successMessage: `Audience created with ID: ${externalId}`,
        savedData: {
          audienceId: externalId,
          audienceName
        }
      }
    }
  }

  if (operation === 'existing') {
    if (!existingAudienceId || typeof existingAudienceId !== 'string') {
      return {
        error: {
          message: 'Missing audience ID value',
          code: 'MISSING_REQUIRED_FIELD'
        }
      }
    } else {
      const { data: { name } = {}, error } = await getAudience(request, existingAudienceId)

      if (error) {
        return { error }
      }

      return {
        successMessage: `Connected to audience with ID: ${existingAudienceId}`,
        savedData: {
          audienceId: existingAudienceId,
          audienceName: name
        }
      }
    }
  }

  return {
    error: {
      message: 'Invalid operation',
      code: 'INVALID_OPERATION'
    }
  }
}

export const generateData = (payloads: Payload[]): (string | number)[][] => {
  const data: (string | number)[][] = new Array(payloads.length)

  payloads.forEach((payload, index) => {
    const row: (string | number)[] = new Array(SCHEMA_PROPERTIES.length).fill('')

    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([nestedKey, value]) => {
          appendToDataRow(nestedKey, value as string | number, row)
        })
      } else {
        appendToDataRow(key, value as string | number, row)
      }
    })

    data[index] = row
  })

  return data
}

export const normalizationFunctions = new Map<string, (value: string) => string>([
  ['email', (value: string) => value.trim().toLowerCase()],
  ['phone', normalizePhone],
  ['gender', normalizeGender],
  ['year', (value: string) => value.trim()],
  ['month', normalizeMonth],
  ['day', (value: string) => value.trim()],
  ['last', normalizeName],
  ['first', normalizeName],
  ['firstInitial', (value: string) => value.trim().toLowerCase()],
  ['city', normalizeCity],
  ['state', normalizeState],
  ['zip', normalizeZip],
  ['country', normalizeCountry]
])

function appendToDataRow(key: string, value: string | number, row: (string | number)[]) {
  const index = segmentSchemaKeyToArrayIndex.get(key)

  if (index === undefined) {
    // ignore batch related keys
    return
  }

  if (typeof value === 'number' || ['externalId', 'mobileAdId'].includes(key)) {
    row[index] = value
    return
  }

  try {
    row[index] = processHashing(value, 'sha256', 'hex', normalizationFunctions.get(key))
  } catch (error) {
    if (error instanceof EmptyValueError) {
      throw new PayloadValidationError(
        `Invalid value for ${key}. After normalization, the value is empty. Please provide a valid ${key} value, or omit this field entirely.`
      )
    } else {
      throw error
    }
  }
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
