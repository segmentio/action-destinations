import { IntegrationError, RequestClient, OAuth2ClientCredentials } from '@segment/actions-core'
import { DependsOnConditions, FieldCondition } from '@segment/actions-core/destination-kit/types'
import { processHashing } from '../../lib/hashing-utils'
import type { Settings } from './generated-types'
import { MatchKeyV1, AmazonConsentFormat, ConsentData, RegionValue, EventData, Region, ConversionTypeV2, CurrencyCodeV1, CustomAttributeV1, MatchKeyTypeV1  } from './types'
import { Payload } from './trackConversion/generated-types'
import { ModifiedResponse } from '@segment/actions-core/*'

export function validateMatchKey(forFieldName: string): DependsOnConditions {
  const allConditions: FieldCondition[] = [
    { fieldKey: 'matchKeys.email', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.phone', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.firstName', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.lastName', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.address', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.city', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.state', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.postalCode', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.maid', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.rampId', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchKeys.matchId', operator: 'is', value: [undefined, null, ''] }
  ]

  const conditions = allConditions.filter(condition => condition.fieldKey !== `matchKeys.${forFieldName}`)
  return {
    match: 'all',
    conditions
  }
}

export function validateConsent(consent: Payload['consent'], region: RegionValue): ConsentData | undefined {
  const { ipAddress, amznAdStorage, amznUserData, tcf, gpp } = consent || {}
  const hasAnyConsent = hasStringValue(ipAddress) || hasStringValue(tcf) || hasStringValue(gpp) || (hasStringValue(amznAdStorage) && hasStringValue(amznUserData))
  if (region === Region.EU) {
    if (!hasAnyConsent) {
      throw new IntegrationError(
        'At least one type of consent (advertising, analytics, personalization, marketing) is required for the EU region.',
        'MISSING_CONSENT',
        400
      )
    }
  }
  if(!hasAnyConsent){
    return undefined 
  }
  return {
    geo: {
      ipAddress: consent?.ipAddress || undefined
    },
    amazonConsent: {
      amznAdStorage: consent?.amznAdStorage || undefined,
      amznUserData: consent?.amznUserData || undefined
    } as AmazonConsentFormat,
    tcf: consent?.tcf || undefined,
    gpp: consent?.gpp || undefined  
  }
}

export function hasStringValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export async function getAuthToken(request: RequestClient, auth: OAuth2ClientCredentials): Promise<string> {
  const response = await request<{ access_token: string }>(
    'https://api.amazon.com/auth/o2/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: auth?.refreshToken,
        client_id: process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || '',
        client_secret: process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_SECRET || ''
      }),
      headers: {
        // Amazon ads refresh token API throws error with authorization header so explicity overriding Authorization header here.
        authorization: ''
      },
      timeout: 15000
    }
  )
  return response.data.access_token
}

export function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  return normalized
}

const alphanumeric = /[^a-z0-9]/g
const emailAllowed = /[^a-z0-9.@-]/g
const nonDigits = /[^\d]/g
const whitespace = /\s+/g

export function normalizeEmail(email: string): string {
  return normalize(email, emailAllowed)
}

export function normalizePhone(phone: string): string {
  return normalize(phone, nonDigits)
}

export function normalizeStandard(value: string): string {
  return normalize(value, alphanumeric)
}

export function normalizePostal(postal: string): string {
  return normalize(postal, whitespace, false)
}

export function smartHash(value: string, normalizeFunction?: (value: string) => string): string {
  return processHashing(value, 'sha256', 'hex', normalizeFunction)
}

export async function sendEventsRequest<T>(request: RequestClient, settings: Settings, events: EventData[]): Promise<ModifiedResponse<T>> {
  return await request<T>(
    `${settings.region}/events/v1`,
    {
      method: 'POST',
      json: {
        eventData: events,
        ingestionMethod: "SERVER_TO_SERVER"
      },
      headers: {
        'Amazon-Ads-AccountId': settings.advertiserId
      },
      timeout: 15000,
      throwHttpErrors: false
    }
  )
}

export function handleAmazonApiError(response: any): IntegrationError {
  const status = response.status;
  const errorData = response.data || {}
  
  switch (status) {
    case 401:
      return new IntegrationError(
        'Authentication failed. Check your API credentials.',
        'AMAZON_AUTH_ERROR',
        401
      );
      
    case 403:
      return new IntegrationError(
        'You do not have permission to access this resource.',
        'AMAZON_FORBIDDEN_ERROR',
        403
      );
      
    case 415:
      return new IntegrationError(
        'Invalid media type. The Content-Type or Accept headers are invalid.',
        'AMAZON_MEDIA_TYPE_ERROR',
        415
      );
      
    case 429:
      // Extract retry information if available
      const retryAfter = response.headers?.['retry-after'] || '';
      return new IntegrationError(
        `Rate limited by Amazon API. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`,
        'AMAZON_RATE_LIMIT_ERROR',
        429
      );
      
    case 500:
      return new IntegrationError(
        'Amazon API encountered an internal server error. Please try again later.',
        'AMAZON_SERVER_ERROR',
        500
      );
      
    case 400:
    default:
      // Extract detailed error information if available
      {
      const errorMessage = errorData.message || response.statusText || 'Unknown error';
      return new IntegrationError(
        `Failed to send event to Amazon: ${errorMessage}`,
        'AMAZON_API_ERROR',
        status || 400
      );
    }
  }
}

export function prepareEventData(payload: Payload, settings: Settings): EventData {
  const { email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId } = payload.matchKeys || {}

  let matchKeys: MatchKeyV1[] = []

  if (email) {
    const hashedEmail = smartHash(email, normalizeEmail)
    matchKeys.push({
      type: MatchKeyTypeV1.EMAIL,
      values: [hashedEmail] as [string]
    })
  }

  if (phone) {
    const hashedPhone = smartHash(phone, normalizePhone)
    matchKeys.push({
      type: MatchKeyTypeV1.PHONE,
      values: [hashedPhone] as [string]
    })
  }

  if (firstName) {
    const hashedFirstName = smartHash(firstName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.FIRST_NAME,
      values: [hashedFirstName] as [string]
    })
  }

  if (lastName) {
    const hashedLastName = smartHash(lastName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.LAST_NAME,
      values: [hashedLastName] as [string]
    })
  }

  if (address) {
    const hashedAddress = smartHash(address, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.ADDRESS,
      values: [hashedAddress] as [string]
    })
  }

  if (city) {
    const hashedCity = smartHash(city, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.CITY,
      values: [hashedCity] as [string]
    })
  }

  if (state) {
    const hashedState = smartHash(state, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.STATE,
      values: [hashedState] as [string]
    })
  }

  if (postalCode) {
    const hashedPostalCode = smartHash(postalCode, normalizePostal)
    matchKeys.push({
      type: MatchKeyTypeV1.POSTAL,
      values: [hashedPostalCode] as [string]
    })
  }

  if (maid) {
    matchKeys.push({
      type: MatchKeyTypeV1.MAID,
      values: [maid] as [string]
    })
  }

  if (rampId) {
    matchKeys.push({
      type: MatchKeyTypeV1.RAMP_ID,
      values: [rampId] as [string]
    })
  }

  if (matchId) {
    matchKeys.push({
      type: MatchKeyTypeV1.MATCH_ID,
      values: [matchId] as [string]
    })
  }

  // Enforce the maximum limit of 11 match keys
  if (matchKeys.length > 11) {
    matchKeys = matchKeys.slice(0, 11)
  }

  const eventData: EventData = {
    name: payload.name,
    eventType: payload.eventType as ConversionTypeV2,
    eventActionSource: payload.eventActionSource,
    countryCode: payload.countryCode,
    timestamp: payload.timestamp
  }

  eventData.matchKeys = matchKeys

  const consent = validateConsent(payload.consent, settings.region as RegionValue)

  Object.assign(eventData, {
    ...(payload.value !== undefined && { value: payload.value }),
    ...(payload.currencyCode && { currencyCode: payload.currencyCode as CurrencyCodeV1 }),
    ...(payload.unitsSold !== undefined && { unitsSold: payload.unitsSold }),
    ...(payload.clientDedupeId && { clientDedupeId: payload.clientDedupeId }),
    ...(payload.dataProcessingOptions && { dataProcessingOptions: payload.dataProcessingOptions }),
    ...(consent && { consent }),
    ...(payload.customAttributes && { customAttributes: payload.customAttributes as CustomAttributeV1[] }),
  })

  return eventData
}