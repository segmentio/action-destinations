import { createHash } from 'crypto'

/**
 * Acceptable data types for k:v pairs.
 */
type DataValues = Record<string, string | string[] | number | undefined>

/**
 * Removes all k:v pairs where the value is falsy.
 */
export function cleanData(data: DataValues): { [key: string]: unknown } {
  if (data == null) {
    return {}
  }
  const obj: { [key: string]: unknown } = {}
  for (const key in data) {
    const value = data[key]
    if (Array.isArray(value)) {
      // remove empty entries
      const filtered = value.filter((item) => item)
      if (filtered.length !== 0) {
        obj[key] = filtered
      }
    } else if (value) {
      obj[key] = value
    }
  }
  return obj
}

/**
 * Convert emails to lower case, remove all spaces, and remove all "." before the "@".
 */
export function formatEmail(email: string): string {
  let formattedEmail
  if (email.toLowerCase().search('@gmail') > -1 || email.toLowerCase().search('@googlemail.com') > -1) {
    // remove all spaces + lower case output
    formattedEmail = email.toLowerCase().replace(/ /g, '')

    // remove all periods before the "@"
    const name = formattedEmail.substr(0, formattedEmail.indexOf('@')).replace(/\./g, '')
    const domain = formattedEmail.substr(formattedEmail.indexOf('@'), formattedEmail.length)
    return hashAndEncode(name.concat(domain))
  } else {
    return hashAndEncode(email.toLowerCase().replace(/ /g, ''))
  }
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

export function formatFirstName(firstName?: string): string {
  if (!firstName) return ''
  return hashAndEncode(firstName.toLowerCase().replace(/[^a-z]/g, ''))
}

export function formatLastName(lastName?: string): string {
  if (!lastName) return ''
  return hashAndEncode(lastName.toLowerCase().replace(/[^a-z]/g, ''))
}

export function formatStreet(street?: string): string {
  if (!street) return ''
  return hashAndEncode(street.toLowerCase())
}

export function formatCity(city?: string): string {
  if (!city) return ''
  return city.toLowerCase().replace(/[^a-z]/g, '')
}

export function formatRegion(region?: string): string {
  if (!region) return ''
  return region.toLowerCase().replace(/[^a-z]/g, '')
}

function hashAndEncode(property: string) {
  return createHash('sha256').update(property).digest('base64')
}
