/**
 * This function checks and cleans a mobile number.
 * If the mobile number starts with a '+', it removes the '+'.
 *
 * @param {string} mobileNumber - The mobile number to be checked and cleaned.
 * @returns {string} - The cleaned mobile number.
 */
const checkAndCleanMobileNumber = (mobileNumber: string) => {
  mobileNumber = mobileNumber.replace(' ', '').replace('-', '')
  if (mobileNumber && mobileNumber.startsWith('+')) {
    mobileNumber = mobileNumber.replace('+', '')
  }

  return mobileNumber
}

export default checkAndCleanMobileNumber
