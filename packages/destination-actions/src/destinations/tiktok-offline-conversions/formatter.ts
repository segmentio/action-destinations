import { createHash } from 'crypto'

const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)

/**
 * Convert emails to lower case, and hash in SHA256.
 */
export const formatEmails = (email_addresses: string[] | undefined): string[] => {
  const result: string[] = []
  if (email_addresses) {
    email_addresses.forEach((email: string) => {
      let resolvedEmail
      if (isHashedInformation(email)) {
        resolvedEmail = email
      } else {
        resolvedEmail = hashAndEncode(email.toLowerCase())
      }

      result.push(resolvedEmail)
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
    if (isHashedInformation(phone)) {
      result.push(phone)
      return
    }

    const validatedPhone = phone.match(/[0-9]{0,14}/g)
    if (validatedPhone === null) {
      throw new Error(`${phone} is not a valid E.164 phone number.`)
    }
    // Remove spaces and non-digits; append + to the beginning
    const formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`
    // Limit length to 15 characters
    result.push(hashAndEncode(formattedPhone.substring(0, 15)))
  })

  return result
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

function hashAndEncode(property: string) {
  return createHash('sha256').update(property).digest('hex')
}
