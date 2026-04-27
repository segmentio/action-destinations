import { PayloadValidationError } from '@segment/actions-core'

const MIN_PHONE_NUMBER_CHAR_LENGTH = 7

/**
 * This function checks and cleans a mobile number.
 * Removes all non-numeric characters and validates the length.
 *
 * @param {string} mobileNumber - The mobile number to be checked and cleaned.
 * @returns {string} - The cleaned mobile number.
 * @throws {PayloadValidationError} - If the phone number is invalid.
 */
function removeNonNumeric(mobileNumber: string): string {
  const numericOnly = mobileNumber.replace(/\D+/g, '')
  if (numericOnly.length < MIN_PHONE_NUMBER_CHAR_LENGTH) {
    throw new PayloadValidationError('Invalid mobile number value')
  }
  return numericOnly
}

const checkAndCleanMobileNumber = (mobileNumber: string) => {
  return removeNonNumeric(mobileNumber)
}

export default checkAndCleanMobileNumber
