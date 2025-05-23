import { IntegrationError, RequestClient } from '@segment/actions-core'
import { processHashing } from '../../lib/hashing-utils'
import type { Settings } from './generated-types'
import type { EventData } from './types'

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
        timeout: 15000
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
      timeout: 25000,
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
