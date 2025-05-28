import { IntegrationError, RequestClient } from '@segment/actions-core'
import { DependsOnConditions, FieldCondition } from '@segment/actions-core/destination-kit/types'
import { processHashing } from '../../lib/hashing-utils'
import type { Settings } from './generated-types'
import type { EventData } from './types'
import type { Payload } from './trackConversion/generated-types'

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
 * @returns true if at least one consent field is present, false otherwise
 */
export function validateConsent(consent?: Payload['consent']): boolean {
  if (!consent) return false
  
  // Check geo field - validate ipAddress
  const hasGeo = consent.geo?.ipAddress ? hasStringValue(consent.geo.ipAddress) : false
  
  // Check amazonConsent - validate both amznAdStorage and amznUserData
  const hasAmazonConsent = consent.amazonConsent ? 
    (hasStringValue(consent.amazonConsent.amznAdStorage) && hasStringValue(consent.amazonConsent.amznUserData)) : false
  
  // Check TCF and GPP strings
  const hasTcf = hasStringValue(consent.tcf)
  const hasGpp = hasStringValue(consent.gpp)
  
  return !!(hasGeo || hasAmazonConsent || hasTcf || hasGpp)
}

interface AuthTokens {
  refreshToken: string;
  [key: string]: any;
}

/**
 * Utility function to get a refreshed auth token
 */
export async function getAuthToken(request: RequestClient, auth: AuthTokens): Promise<string> {
  try {
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
        timeout: 2500
      }
    )

    return response.data.access_token
  } catch (error) {
    throw new Error(`Failed to refresh access token: ${error.message}`)
  }
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
const emailAllowed = /[^a-z0-9.@-]/g
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
 * @returns The API response
 */
export async function sendEventsRequest(
  request: RequestClient,
  settings: Settings,
  eventData: EventData | EventData[]
): Promise<any> {
  // Ensure eventData is always an array
  const events = Array.isArray(eventData) ? eventData : [eventData];
  
  return await request(
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
  );
}

/**
 * Handle errors from the Amazon API based on status codes
 * 
 * @param response The API error response
 * @returns An IntegrationError with appropriate code and message
 */
export function handleAmazonApiError(response: any): IntegrationError {
  const status = response.status;
  const errorData = response.data || {};
  
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
      const errorMessage = errorData.message || response.statusText || 'Unknown error';
      return new IntegrationError(
        `Failed to send event to Amazon: ${errorMessage}`,
        'AMAZON_API_ERROR',
        status || 400
      );
  }
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


/**
 * Creates a validation rule that requires at least one of the identifier fields to be non-empty.
 * When applied to each identifier field, this ensures that at least one field must have a value.
 * 
 * @param fieldName The name of the current field being validated
 * @returns A DependsOnConditions object for field validation
 */
export function requireAtLeastOneIdentifier(fieldName: string): DependsOnConditions {
  // Create conditions checking if each identifier field is empty
  const allEmptyConditions: FieldCondition[] = [
    { fieldKey: 'email', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'phone', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'firstName', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'lastName', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'address', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'city', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'state', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'postalCode', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'maid', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'rampId', operator: 'is', value: [undefined, null, ''] },
    { fieldKey: 'matchId', operator: 'is', value: [undefined, null, ''] }
  ]
  
  const conditions = allEmptyConditions.filter(condition => condition.fieldKey !== fieldName)
  
  // Return a DependsOnConditions object that requires ALL conditions to match
  // If ALL OTHER identifier fields are empty, this field becomes required
  return {
    match: 'all',
    conditions
  }
}
