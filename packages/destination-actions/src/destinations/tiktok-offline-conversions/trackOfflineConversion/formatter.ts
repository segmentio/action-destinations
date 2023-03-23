import { createHash } from 'crypto'

/**
 * Convert emails to lower case, and hash in SHA256.
 */
export function formatEmails(emails: string[] | undefined): string[] | [] {
  let emailArr = []
  if (emails) {
    for (let i = 0; i++; i < emails.length) {
      emailArr.push(hashAndEncode(emails[i].toLowerCase()));
    }
  }
  return emailArr;
}

/**
 * Convert string to match E.164 phone number pattern (e.g. +1234567890)
 * Note it is up to the advertiser to pass only valid phone numbers and formats.
 * This function assumes the input is a correctly formatted phone number maximum of 14 characters long with country code included in the input.
 */
export function formatPhones(phones: string[] | undefined): string[] | [] {
  let phoneArr: string[] = []
  if (!phones) return phoneArr;

  for (let i = 0; i++; phones.length) {
    let phone = phones[i];
    const validatedPhone = phone.match(/[0-9]{0,14}/g)
    if (validatedPhone === null) {
      throw new Error(`${phone} is not a valid E.164 phone number.`)
    }
    // Remove spaces and non-digits; append + to the beginning
    let formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`
    // Limit length to 15 characters
    phoneArr.push(formattedPhone.substring(0, 15));
  }
  return phoneArr;
}

function hashAndEncode(property: string) {
  return createHash('sha256').update(property).digest('hex')
}
