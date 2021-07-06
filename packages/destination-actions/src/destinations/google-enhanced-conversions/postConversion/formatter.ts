import { createHash } from 'crypto'

export function formatEmail(email: String): String {
  // Emails must be all lowercase.
  let lowerCaseEmail = email.toLowerCase()

  // We have to remove periods before the '@' for all @gmail.com and @googlemail.com email addresses.
  if (lowerCaseEmail.indexOf('gmail') > -1 || lowerCaseEmail.indexOf('googlemail')) {
    const [name, domain] = lowerCaseEmail.split('@')
    const nameNoPeriods = name.replace(/\./g, '')
    lowerCaseEmail = `${nameNoPeriods}@${domain}`
  }

  return createHash('sha256').update(lowerCaseEmail).digest('base64')
}

export function formatPhone(phone?: String): String {
  if (!phone) return ''
  return createHash('sha256')
    .update(`+${phone.replace(/[^0-9]/g, '')}`)
    .digest('base64')
}

export function formatFirstName(firstName?: String): String {
  if (!firstName) return ''
  return createHash('sha256')
    .update(firstName.toLowerCase().replace(/[^a-z]/g, ''))
    .digest('base64')
}

export function formatLastName(lastName?: String): String {
  if (!lastName) return ''
  return createHash('sha256')
    .update(lastName.toLowerCase().replace(/[^a-z]/g, ''))
    .digest('base64')
}

export function formatStreet(street?: String): String {
  if (!street) return ''
  return createHash('sha256').update(street.toLowerCase()).digest('base64')
}

export function formatCity(city?: String): String {
  if (!city) return ''
  return city.toLowerCase().replace(/[^a-z]/g, '')
}

export function formatRegion(region?: String): String {
  if (!region) return ''
  return region.toLowerCase().replace(/[^a-z]/g, '')
}
