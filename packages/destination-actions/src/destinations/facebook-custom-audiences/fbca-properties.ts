import { GlobalSetting, InputField } from '@segment/actions-core'
import { US_STATE_CODES } from './constants'

export const adAccountId: GlobalSetting = {
  type: 'string',
  label: 'Advertiser Account ID',
  description: 'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762).',
  required: true
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true,
  required: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  default: 10000,
  unsafe_hidden: true,
  required: true
}

// A hardcoded list of all possible schema properties that can be sent to Facebook.
// If the payloads do not contain a value for one of these schema properties, then empty string will be sent
export const SCHEMA_PROPERTIES = [
  'EXTERN_ID',
  'EMAIL',
  'PHONE',
  'GEN',
  'DOBY',
  'DOBM',
  'DOBD',
  'LN',
  'FN',
  'FI',
  'CT',
  'ST',
  'ZIP',
  'MADID',
  'COUNTRY'
]

// A list of the segment equivalent to each Facebook schema property
// It is important that each segment schema property is in the same order as the Facebook schema properties
export const SEGMENT_SCHEMA_PROPERTIES = [
  'externalId',
  'email',
  'phone',
  'gender',
  'year',
  'month',
  'day',
  'last',
  'first',
  'firstInitial',
  'city',
  'state',
  'zip',
  'mobileAdId',
  'country'
]

export const segmentSchemaKeyToArrayIndex = new Map<string, number>(
  SEGMENT_SCHEMA_PROPERTIES.map((property, index) => [property, index])
)

const normalizePhone = (value: string): string => {
  const removedNonNumveric = value.replace(/\D/g, '')

  return removedNonNumveric.replace(/^0+/, '')
}
const normalizeGender = (value: string): string => {
  const lowerCaseValue = value.toLowerCase().trim()

  if (['male', 'boy', 'm'].includes(lowerCaseValue)) return 'm'
  if (['female', 'woman', 'girl', 'f'].includes(lowerCaseValue)) return 'f'

  return value
}

const normalizeMonth = (value: string): string => {
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
const normalizeName = (value: string): string => {
  return value.trim().toLowerCase().replace(/\p{P}/gu, '')
}

const normalizeCity = (value: string): string => {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}
const normalizeState = (value: string): string => {
  if (US_STATE_CODES.has(value.toLowerCase().trim())) {
    return US_STATE_CODES.get(value.toLowerCase().trim())!
  }

  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
}
const normalizeZip = (value: string): string => {
  if (value.includes('-')) {
    return value.split('-')[0]
  }

  return value.trim().replace(/\s/g, '').toLowerCase()
}

const normalizeCountry = (value: string): string => {
  return value
    .trim()
    .replace(/[\s\W_]/g, '')
    .toLowerCase()
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
