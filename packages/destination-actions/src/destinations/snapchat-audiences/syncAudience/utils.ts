import { createHash } from 'crypto'

type IdentifierResult = { found: true; externalId: string } | { found: false; message: string }

// Extracts correct identifier and returns normalized and hashed identifier
export const validateAndExtractIdentifier = (
  schemaType: string,
  mobileIdType: string,
  email: string | undefined,
  phone: string | undefined,
  advertisingId: string | undefined,
  mobileDeviceId: string | undefined
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
    let mobileId

    if (mobileIdType === 'deviceId') {
      mobileId = mobileDeviceId
    } else {
      mobileId = advertisingId
    }
    return mobileId
      ? { found: true, externalId: normalizeAndHashMobileId(mobileId) }
      : { found: false, message: 'Mobile ID not present in payload' }
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
const normalizeAndHashEmail = (email: string): string => {
  if (isHashed(email)) return email
  const hashedEmail = hash(email.trim().toLowerCase())
  return hashedEmail
}
// Normalize mobile advertiser id by using all lowercase
const normalizeAndHashMobileId = (mobileAdId: string): string => {
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
const normalizeAndHashPhone = (phone: string): string => {
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
