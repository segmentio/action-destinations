import {
  IntegrationError,
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ModifiedResponse,
  APIError
} from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import type { Settings } from '../generated-types'
import type {
  EventData,
  ConsentData,
  RegionValue,
  AmazonConsentFormat,
  ImportConversionEventsResponse,
  EventDataSuccessResponseV1,
  EventDataErrorResponseV1,
  MatchKeyV1,
  ConversionTypeV2,
  CurrencyCodeV1,
  CustomAttributeV1
} from '../types'
import { MatchKeyTypeV1, Region } from '../types'
import type { Payload } from './generated-types'

/**
 * Helper function to validate if a string value exists and is not empty
 *
 * @param value The string value to validate
 * @returns true if the value is a non-empty string, false otherwise
 */
export function hasStringValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates that at least one consent field is present
 *
 * @param consent The consent data object from the payload
 * @param region The region value
 * @returns ConsentData if at least one consent field is present, undefined otherwise
 */
export function validateConsent(consent: Payload['consent'], region: RegionValue): ConsentData | undefined {
  const { ipAddress, amznAdStorage, amznUserData, tcf, gpp } = consent || {}
  const consentData: Partial<ConsentData> = {
    ...(hasStringValue(ipAddress) && { geo: { ipAddress } }),
    ...(hasStringValue(amznAdStorage) &&
      hasStringValue(amznUserData) && {
        amazonConsent: {
          amznAdStorage,
          amznUserData
        } as AmazonConsentFormat
      }),
    ...(hasStringValue(tcf) && { tcf }),
    ...(hasStringValue(gpp) && { gpp })
  }
  const hasAnyConsent = Object.keys(consentData).length > 0
  if (region === Region.EU && !hasAnyConsent) {
    throw new IntegrationError(
      'At least one type of consent (Geographic info, Amazon consent, Transparency and Consent Framework (TCF), Global Privacy Platform (GPP)) is required for the EU region.',
      'MISSING_CONSENT',
      400
    )
  }
  return hasAnyConsent ? (consentData as ConsentData) : undefined
}

/**
 * General normalization utility function for string values
 * @param value - Input string to normalize
 * @param allowedChars - RegExp pattern of characters to remove
 * @param trim - Whether to trim whitespace (default: true)
 * @returns Normalized string
 */
export function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  return normalized
}

// RegExp patterns for normalization
const alphanumeric = /[^a-z0-9]/g
const emailAllowed = /[^a-z0-9.@+-]/g
const nonDigits = /[^\d]/g
const whitespace = /\s+/g

/**
 * Normalizes an email address according to Amazon's requirements:
 * Lowercase, remove all non-alphanumeric characters except [.@-],
 * and remove any leading or trailing whitespace.
 */
export function normalizeEmail(email: string): string {
  return normalize(email, emailAllowed)
}

/**
 * Normalizes a phone number by removing all non-digit characters
 */
export function normalizePhone(phone: string): string {
  return normalize(phone, nonDigits)
}

/**
 * Normalizes a standard string by lowercasing and removing non-alphanumeric characters
 * Used for firstName, lastName, address, city, state
 */
export function normalizeStandard(value: string): string {
  return normalize(value, alphanumeric)
}

/**
 * Normalizes a postal code by removing spaces
 */
export function normalizePostal(postal: string): string {
  return normalize(postal, whitespace, false)
}

/**
 * Helper function to smart-hash a value with proper normalization
 * @param value - The value to hash
 * @param normalizeFunction - Optional normalization function to apply
 * @returns The properly normalized and hashed value, or original if already hashed
 */
export function smartHash(value: string, normalizeFunction?: (value: string) => string): string {
  return processHashing(value, 'sha256', 'hex', normalizeFunction)
}

/**
 * Sends event data to the Amazon Conversions API
 *
 * @param request The request client
 * @param settings The API settings
 * @param eventData The event data to send (single event or array of events)
 * @param throwHttpErrors Whether to throw HTTP errors (defaults to false)
 * @returns The API response with ImportConversionEventsResponse data
 */
export async function sendEventsRequest<ImportConversionEventsResponse>(
  request: RequestClient,
  settings: Settings,
  eventData: EventData | EventData[]
): Promise<ModifiedResponse<ImportConversionEventsResponse>> {
  // Ensure eventData is always an array
  const events = Array.isArray(eventData) ? eventData : [eventData]

  return await request<ImportConversionEventsResponse>(`${settings.region}/events/v1`, {
    method: 'POST',
    json: {
      eventData: events,
      ingestionMethod: 'SERVER_TO_SERVER'
    },
    headers: {
      'Amazon-Ads-AccountId': settings.advertiserId
    },
    timeout: 25000,
    throwHttpErrors: false
  })
}

/**
 * Validates and normalizes a country code from either ISO or locale format
 *
 * @param input The country code or locale to validate
 * @returns A normalized ISO 3166-1 alpha-2 country code
 * @throws IntegrationError if the input is not a valid country code or locale
 */
export function validateCountryCode(input: string): string {
  const normalized = input.trim()

  // Regex to match locale format: language-region (e.g., en-US)
  const localeMatch = normalized.match(/^[a-zA-Z]{2,3}-([A-Z]{2})$/)
  if (localeMatch) {
    return localeMatch[1]
  }

  // Regex to match ISO 3166-1 alpha-2 country codes (e.g., US, CA, GB)
  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized
  }

  throw new IntegrationError(
    'Country code must be in ISO 3166-1 alpha-2 format (e.g., US, CA) or a valid locale format (e.g., en-US).',
    'MISSING_COUNTRY_CODE',
    400
  )
}

export function handleResponse(
  response: ModifiedResponse<ImportConversionEventsResponse>
): ModifiedResponse<ImportConversionEventsResponse> {
  if (response.status === 207 && response.data) {
    const responseData = response.data

    if (responseData.error && Array.isArray(responseData.error) && responseData.error.length > 0) {
      return {
        ...response,
        status: Number(responseData.error[0].httpStatusCode) || 400
      }
    }
  }
  return response
}

/**
 * Process the Amazon API response and update the multi-status response
 * Handles 207 multistatus responses with errors
 */
export function handleBatchResponse(
  response: ModifiedResponse<ImportConversionEventsResponse>,
  validPayloads: EventData[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  if (response.status === 207 && response.data) {
    const responseData = response.data
    const successMap: Record<number, EventDataSuccessResponseV1> = {}
    const errorMap: Record<number, EventDataErrorResponseV1> = {}

    if (responseData.success && Array.isArray(responseData.success)) {
      responseData.success.forEach((item) => {
        successMap[item.index - 1] = item
      })
    }

    if (responseData.error && Array.isArray(responseData.error)) {
      responseData.error.forEach((item) => {
        errorMap[item.index - 1] = item
      })
    }

    validPayloads.forEach((payload, arrayPosition) => {
      const originalIndex = validPayloadIndicesBitmap[arrayPosition]
      if (errorMap[arrayPosition]) {
        const errorResult = errorMap[arrayPosition]
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: parseInt(errorResult.httpStatusCode || '400', 10),
          sent: payload as unknown as JSONLikeObject,
          body: errorResult as unknown as JSONLikeObject,
          errormessage: errorResult.subErrors?.[0]?.errorMessage || 'Error processing payload'
        })
      } else if (successMap[arrayPosition]) {
        multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
          status: 200,
          sent: payload as unknown as JSONLikeObject,
          body: successMap[arrayPosition] as unknown as JSONLikeObject
        })
      } else {
        // should never happen
        throw new APIError('Unable to match event in request payload to response from Amazon API', 500)
      }
    })
  } else {
    validPayloadIndicesBitmap.forEach((originalIndex, arrayPosition) => {
      multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
        status: response.status || 400,
        errormessage: response.statusText || 'Amazon API request failed',
        sent: validPayloads[arrayPosition] as unknown as JSONLikeObject
      })
    })
  }
  return multiStatusResponse
}

export function prepareEventData(payload: Payload, settings: Settings): EventData {
  const { email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId } =
    payload.matchKeys || {}

  // Process match keys
  let matchKeys: MatchKeyV1[] = []

  if (email && typeof email === 'string') {
    const hashedEmail = smartHash(email, normalizeEmail)
    matchKeys.push({
      type: MatchKeyTypeV1.EMAIL,
      values: [hashedEmail]
    })
  }

  if (phone && typeof phone === 'string') {
    const hashedPhone = smartHash(phone, normalizePhone)
    matchKeys.push({
      type: MatchKeyTypeV1.PHONE,
      values: [hashedPhone]
    })
  }

  if (firstName && typeof firstName === 'string') {
    const hashedFirstName = smartHash(firstName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.FIRST_NAME,
      values: [hashedFirstName]
    })
  }

  if (lastName && typeof lastName === 'string') {
    const hashedLastName = smartHash(lastName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.LAST_NAME,
      values: [hashedLastName]
    })
  }

  if (address && typeof address === 'string') {
    const hashedAddress = smartHash(address, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.ADDRESS,
      values: [hashedAddress]
    })
  }

  if (city && typeof city === 'string') {
    const hashedCity = smartHash(city, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.CITY,
      values: [hashedCity]
    })
  }

  if (state && typeof state === 'string') {
    const hashedState = smartHash(state, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.STATE,
      values: [hashedState]
    })
  }

  if (postalCode && typeof postalCode === 'string') {
    const hashedPostalCode = smartHash(postalCode, normalizePostal)
    matchKeys.push({
      type: MatchKeyTypeV1.POSTAL,
      values: [hashedPostalCode]
    })
  }

  if (maid && typeof maid === 'string') {
    matchKeys.push({
      type: MatchKeyTypeV1.MAID,
      values: [maid]
    })
  }

  if (rampId && typeof rampId === 'string') {
    matchKeys.push({
      type: MatchKeyTypeV1.RAMP_ID,
      values: [rampId]
    })
  }

  if (matchId && typeof matchId === 'string') {
    matchKeys.push({
      type: MatchKeyTypeV1.MATCH_ID,
      values: [matchId]
    })
  }

  // Enforce the maximum limit of 11 match keys
  if (matchKeys.length > 11) {
    matchKeys = matchKeys.slice(0, 11)
  }

  // Check if we have at least one match key after processing
  if (matchKeys.length === 0) {
    throw new IntegrationError('At least one valid match key must be provided.', 'MISSING_MATCH_KEY', 400)
  }

  // Prepare event data
  const eventData: EventData = {
    name: payload.name,
    eventType: payload.eventType as ConversionTypeV2,
    eventActionSource: payload.eventActionSource.toUpperCase(),
    countryCode: validateCountryCode(payload.countryCode),
    timestamp: payload.timestamp
  }

  if (matchKeys) {
    eventData.matchKeys = matchKeys
  }

  const consent = validateConsent(payload.consent, settings.region as RegionValue)

  Object.assign(eventData, {
    ...(payload.value !== undefined && { value: payload.value }),
    ...(payload.currencyCode && { currencyCode: payload.currencyCode as CurrencyCodeV1 }),
    ...(payload.unitsSold !== undefined && { unitsSold: payload.unitsSold }),
    ...(payload.clientDedupeId && { clientDedupeId: payload.clientDedupeId }),
    ...(payload.dataProcessingOptions && { dataProcessingOptions: payload.dataProcessingOptions }),
    ...(consent && { consent }),
    ...(payload.customAttributes && { customAttributes: payload.customAttributes as CustomAttributeV1[] }),
    ...(payload.amazonImpressionId && { amazonImpressionId: payload.amazonImpressionId }),
    ...(payload.amazonClickId && { amazonClickId: payload.amazonClickId })
  })

  return eventData
}
