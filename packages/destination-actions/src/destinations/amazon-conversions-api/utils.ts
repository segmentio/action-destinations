import type { RequestClient } from '@segment/actions-core'
import { processHashingV2 } from '../../lib/hashing-utils'

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
  return processHashingV2(value, 'sha256', 'hex', normalizeFunction)
}
