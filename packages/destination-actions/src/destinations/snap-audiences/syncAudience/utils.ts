import type { Payload } from './generated-types'
import { createHash } from 'crypto'

// Filters out events with missing identifiers and sorts based on audience entered/exited
export const sortPayload = (payload: Payload[]) => {
  return payload.reduce<{
    enteredAudience: string[][]
    exitedAudience: string[][]
  }>(
    (acc, payloadItem) => {
      const audienceEntered = payloadItem.props[payloadItem.audienceKey]
      const externalId = validateAndExtractIdentifier(
        payloadItem.schema_type,
        payloadItem.email,
        payloadItem.phone,
        payloadItem.advertising_id
      )

      if (externalId) {
        if (audienceEntered) {
          acc.enteredAudience.push([externalId])
        } else {
          acc.exitedAudience.push([externalId])
        }
      }

      return acc
    },
    { enteredAudience: [], exitedAudience: [] }
  )
}
export const validationError = (schema_type: string): string => {
  switch (schema_type) {
    case 'MOBILE_AD_ID_SHA256':
      return 'Mobile Advertising ID'
    case 'EMAIL_SHA256':
      return 'Email'
    case 'PHONE_SHA256':
      return 'Phone number'
    default:
      return 'Identifier'
  }
}

// Returns normalized and hashed identifier or null if not present
const validateAndExtractIdentifier = (
  schemaType: string,
  email: string | undefined,
  phone: string | undefined,
  mobileAdId: string | undefined
): string | null => {
  if (schemaType === 'EMAIL_SHA256' && email) {
    return normalizeAndHash(email)
  }
  if (schemaType === 'MOBILE_AD_ID_SHA256' && mobileAdId) {
    return normalizeAndHash(mobileAdId)
  }
  if (schemaType === 'PHONE_SHA256' && phone) {
    return normalizeAndHashPhone(phone)
  }

  return null
}

const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

const isHashed = (identifier: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(identifier)

export const normalizeAndHash = (identifier: string): string => {
  if (isHashed(identifier)) return identifier
  const hashedIdentifier = hash(identifier.trim().toLowerCase())
  return hashedIdentifier
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
