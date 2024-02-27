/**
 * Convert string to match E.164 phone number pattern (e.g. +1234567890)
 * Note it is up to the advertiser to pass only valid phone numbers and formats.
 * This function assumes the input is a correctly formatted phone number maximum of 14 characters long with country code included in the input.
 */
export function formatPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined

  const validatedPhone = phone.match(/[0-9]{0,14}/g)
  if (validatedPhone === null) {
    throw new Error(`${phone} is not a valid E.164 phone number.`)
  }
  // Remove spaces and non-digits; append + to the beginning
  let formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`
  // Limit length to 15 characters
  formattedPhone = formattedPhone.substring(0, 15)
  return formattedPhone
}
