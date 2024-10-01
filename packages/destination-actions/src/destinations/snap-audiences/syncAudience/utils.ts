import type { Payload } from './generated-types'
import { createHash } from 'crypto'

type IdentifierResult = { found: true; externalId: string } | { found: false; message: string }

// Extracts correct identifier and returns normalized and hashed identifier
export const validateAndExtractIdentifier = (
  schemaType: string,
  email: string | undefined,
  phone: string | undefined,
  mobileAdId: string | undefined
): IdentifierResult => {
  if (schemaType === 'EMAIL_SHA256') {
    return email
      ? { found: true, externalId: normalizeAndHashEmail(email) }
      : { found: false, message: 'Email not present in payload' }
  }

  if (schemaType === 'PHONE_SHA256') {
    return phone
      ? { found: true, externalId: normalizeAndHashPhone(phone) }
      : { found: false, message: 'Phone number not present in payload' }
  }

  if (schemaType === 'MOBILE_AD_ID_SHA256') {
    return mobileAdId
      ? { found: true, externalId: normalizeAndHashMobileId(mobileAdId) }
      : { found: false, message: 'Mobile AD ID not present in payload' }
  }

  return { found: false, message: 'Schema type not recognized' }
}

// Hashing function
const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

// Test to check if value is already hashed
const isHashed = (identifier: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(identifier)

// Normalize email addresses by trimming leading and trailing whitespace and converting all characters to lowercase before hashing
export const normalizeAndHashEmail = (email: string): string => {
  if (isHashed(email)) return email
  const hashedEmail = hash(email.trim().toLowerCase())
  return hashedEmail
}
// Normalize mobile advertiser id by using all lowercase
export const normalizeAndHashMobileId = (mobileAdId: string): string => {
  if (isHashed(mobileAdId)) return mobileAdId
  const hashedMobileId = hash(mobileAdId.toLowerCase())
  return hashedMobileId
}

/*
  Normalize phone numbers by
  - removing any double 0 in front of the country code
  - if the number itself begins with a 0 this should be removed
  - Also exclude any non-numeric characters such as whitespace, parentheses, '+', or '-'.
*/
export const normalizeAndHashPhone = (phone: string): string => {
  if (isHashed(phone)) return phone

  // Remove non-numeric characters and parentheses, '+', '-', ' '
  let normalizedPhone = phone.replace(/[\s()+-]/g, '')

  // Remove leading "00" if present
  if (normalizedPhone.startsWith('00')) {
    normalizedPhone = normalizedPhone.substring(2)
  }

  // Remove leading zero if present (for local numbers)
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = normalizedPhone.substring(1)
  }

  const hashedPhone = hash(normalizedPhone)
  return hashedPhone
}

export const sortBatch = (payload: Payload[]) => {
  return payload.reduce<{
    enteredAudience: string[][]
    exitedAudience: string[][]
  }>(
    (acc, payloadItem) => {
      const audienceEntered = payloadItem.traits_or_props[payloadItem.audienceKey]
      const response = validateAndExtractIdentifier(
        payloadItem.schema_type,
        payloadItem.email,
        payloadItem.phone,
        payloadItem.advertising_id
      )

      if (response.found) {
        if (audienceEntered) {
          acc.enteredAudience.push([response.externalId])
        } else {
          acc.exitedAudience.push([response.externalId])
        }
      }

      return acc
    },
    { enteredAudience: [], exitedAudience: [] }
  )
}

export const batchErrorMessage = (schema_type: string): string => {
  switch (schema_type) {
    case 'MOBILE_AD_ID_SHA256':
      return 'Mobile Advertising IDs'
    case 'EMAIL_SHA256':
      return 'Emails'
    case 'PHONE_SHA256':
      return 'Phone numbers'
    default:
      return 'Identifiers'
  }
}
