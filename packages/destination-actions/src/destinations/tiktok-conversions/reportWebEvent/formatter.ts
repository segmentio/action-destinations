import { createHash } from 'crypto'

/**
 * Convert emails to lower case, and hash in SHA256.
 */
export function formatEmail(email: string): string {
  return hashAndEncode(email.toLowerCase())
}

/**
 *
 * @param userId
 * @returns Leading/Trailing spaces are trimmed and then userId is hashed.
 */
export function formatUserId(userId: string): string {
  return hashAndEncode(userId.toLowerCase().trim())
}

/**
 * Convert string to match E.164 phone number pattern (e.g. +1234567890)
 * Note it is up to the advertiser to pass only valid phone numbers and formats.
 * This function assumes the input is a correctly formatted phone number maximum of 14 characters long with country code included in the input.
 */
export function formatPhone(phone?: string): string {
  if (!phone) return ''

  const validatedPhone = phone.match(/[0-9]{0,14}/g)
  if (validatedPhone === null) {
    throw new Error(`${phone} is not a valid E.164 phone number.`)
  }
  // Remove spaces and non-digits; append + to the beginning
  let formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`
  // Limit length to 15 characters
  formattedPhone = formattedPhone.substring(0, 15)
  return hashAndEncode(formattedPhone)
}

function hashAndEncode(property: string) {
  // Format is websafe-base64 encoded according to https://datatracker.ietf.org/doc/html/rfc4648#section-5
  return createHash('sha256').update(property).digest('hex')
}
