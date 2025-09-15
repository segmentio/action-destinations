import { processHashing } from '../../lib/hashing-utils'
/**
 * Convert emails to lower case, and hash in SHA256.
 */
export const formatEmails = (email_addresses: string[] | undefined): string[] => {
  const result: string[] = []
  if (email_addresses) {
    email_addresses.forEach((email: string) => {
      result.push(hashAndEncode(email.toLowerCase()))
    })
  }
  return result
}

/**
 * Convert string to match E.164 phone number pattern (e.g. +1234567890)
 * Note it is up to the advertiser to pass only valid phone numbers and formats.
 * This function assumes the input is a correctly formatted phone number maximum of 14 characters long with country code included in the input.
 */
export const formatPhones = (phone_numbers: string[] | undefined): string[] => {
  const result: string[] = []
  if (!phone_numbers) return result

  phone_numbers.forEach((phone: string) => {
    // Limit length to 15 characters
    result.push(hashAndEncode(phone, cleanPhoneNumber))
  })
  return result
}

const cleanPhoneNumber = (phone: string): string => {
  const validatedPhone = phone.match(/[0-9]{0,14}/g)
  if (validatedPhone === null) {
    throw new Error(`${phone} is not a valid E.164 phone number.`)
  }
  // Remove spaces and non-digits; append + to the beginning
  const formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`
  return formattedPhone.substring(0, 15)
}

/**
 *
 * @param userId
 * @returns Leading/Trailing spaces are trimmed and then userId is hashed.
 */
export function formatUserIds(userIds: string[] | undefined): string[] {
  const result: string[] = []
  if (userIds) {
    userIds.forEach((userId: string) => {
      result.push(hashAndEncode(userId.toLowerCase()))
    })
  }
  return result
}

export function formatString(str: string | undefined | null): string | undefined {
  if (!str) return ''
  return hashAndEncode(str.replace(/\s/g, '').toLowerCase())
}

export function formatAddress(address: string | undefined | null): string | undefined {
  if (!address) return ''
  return address.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

function hashAndEncode(property: string, cleaningFunction?: (value: string) => string): string {
  return processHashing(property, 'sha256', 'hex', cleaningFunction)
}
