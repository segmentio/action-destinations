import {
  IntegrationError,
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ModifiedResponse,
  APIError
} from '@segment/actions-core'
import { processHashing, EmptyValueError } from '../../../lib/hashing-utils'
import type { Settings } from '../generated-types'
import type {
  EventData,
  ConsentData,
  EventDescription,
  DataProcessingOptions,
  RegionValue,
  AmazonConsentFormat,
  EventMultiStatusResponse,
  EventMultiStatusSuccess,
  ErrorsIndex,
  MatchKeyV1,
  CurrencyCodeV1,
  CustomAttributeV1
} from '../types'
import { MatchKeyTypeV1, Region, ConversionTypeV2 } from '../types'
import type { Payload } from './generated-types'
import { AMAZON_CONVERSIONS_API_EVENTS_VERSION } from '../versioning-info'

/**
 * Helper function to validate if a string value exists and is not empty
 *
 * @param value The string value to validate
 * @returns true if the value is a non-empty string, false otherwise
 */
export function hasStringValue(value: string | null | undefined): value is string {
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
    ...(hasStringValue(amznUserData) && {
      amazonConsent: {
        amznUserData,
        ...(hasStringValue(amznAdStorage) && { amznAdStorage })
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
 * Hashes a match key value and appends it to matchKeys. Some values (e.g. "+++" for phone)
 * are non-empty but normalize down to an empty string, which would otherwise cause the
 * hashing utility to throw "Cannot hash an empty string" - that error is caught here and
 * the field is skipped instead, without normalizing the value more than once.
 */
function addHashedMatchKey(
  matchKeys: MatchKeyV1[],
  type: MatchKeyTypeV1,
  value: string | null | undefined,
  normalizeFunction: (value: string) => string
): void {
  if (!hasStringValue(value)) {
    return
  }
  try {
    matchKeys.push({ type, values: [smartHash(value, normalizeFunction)] })
  } catch (err) {
    if (!(err instanceof EmptyValueError)) {
      throw err
    }
  }
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

  return await request<ImportConversionEventsResponse>(
    `${settings.region}/adsApi/${AMAZON_CONVERSIONS_API_EVENTS_VERSION}/create/events`,
    {
      method: 'POST',
      json: {
        events: events
      },
      headers: {
        'Amazon-Ads-AccountId': settings.advertiserId,
        'Amazon-Ads-ClientId': process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || ''
      },
      throwHttpErrors: false
    }
  )
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
  response: ModifiedResponse<EventMultiStatusResponse>
): ModifiedResponse<EventMultiStatusResponse> {
  if (response.status === 207 && response.data) {
    const responseData = response.data

    if (responseData.error && Array.isArray(responseData.error) && responseData.error.length > 0) {
      return {
        ...response,
        status: 400
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
  response: ModifiedResponse<EventMultiStatusResponse>,
  validPayloads: EventData[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  if (response.status === 207 && response.data) {
    const responseData = response.data
    const successMap: Record<number, EventMultiStatusSuccess> = {}
    const errorMap: Record<number, ErrorsIndex> = {}

    if (responseData.success && Array.isArray(responseData.success)) {
      responseData.success.forEach((item) => {
        successMap[item.index] = item
      })
    }

    if (responseData.error && Array.isArray(responseData.error)) {
      responseData.error.forEach((item) => {
        errorMap[item.index] = item
      })
    }

    validPayloads.forEach((payload, arrayPosition) => {
      const originalIndex = validPayloadIndicesBitmap[arrayPosition]
      if (errorMap[arrayPosition]) {
        const errorResult = errorMap[arrayPosition]
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: parseInt('400', 10),
          sent: payload as unknown as JSONLikeObject,
          body: errorResult as unknown as JSONLikeObject,
          errormessage: errorResult.errors[0].message || 'Error processing payload'
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
  const {
    customAttributes,
    matchKeys: { email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId } = {}
  } = payload

  // Process match keys
  let matchKeys: MatchKeyV1[] = []

  addHashedMatchKey(matchKeys, MatchKeyTypeV1.EMAIL, email, normalizeEmail)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.PHONE, phone, normalizePhone)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.FIRST_NAME, firstName, normalizeStandard)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.LAST_NAME, lastName, normalizeStandard)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.ADDRESS, address, normalizeStandard)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.CITY, city, normalizeStandard)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.STATE, state, normalizeStandard)
  addHashedMatchKey(matchKeys, MatchKeyTypeV1.POSTAL, postalCode, normalizePostal)

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

  // Process custom attributes
  const customAttributeArray: CustomAttributeV1[] = []
  Object.entries(customAttributes ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    customAttributeArray.push({
      name: key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    })
  })

  const eventDescription: EventDescription = {
    name: payload.name,
    conversionType: payload.eventType as ConversionTypeV2,
    eventSource: payload.eventActionSource.toUpperCase(),
    eventIngestionMethod: 'SERVER_TO_SERVER',
    ...(settings.dataSetName ? { dataSetName: settings.dataSetName } : {})
  }

  const eventData: EventData = {
    eventDescription,
    countryCode: validateCountryCode(payload.countryCode),
    eventTime: payload.timestamp
  }

  if (matchKeys) {
    eventData.matchKeys = matchKeys
  }

  const consent = validateConsent(payload.consent, settings.region as RegionValue)

  Object.assign(eventData, {
    ...(payload.value !== undefined && { value: payload.value }),
    ...(payload.eventType === ConversionTypeV2.OFF_AMAZON_PURCHASES &&
      payload.currencyCode && {
        currencyCode: payload.currencyCode as CurrencyCodeV1
      }),
    ...(payload.eventType === ConversionTypeV2.OFF_AMAZON_PURCHASES &&
      payload.unitsSold !== undefined && {
        unitsSold: payload.unitsSold
      }),
    ...(payload.clientDedupeId && { eventId: payload.clientDedupeId }),
    ...(payload.dataProcessingOptions?.[0] && {
      dataProcessingOptions: {
        options: payload.dataProcessingOptions[0]
      } as DataProcessingOptions
    }),

    ...(consent && { consent }),
    ...(payload.customAttributes && {
      customData: customAttributeArray.length > 0 ? customAttributeArray : undefined
    })
  })

  return eventData
}
