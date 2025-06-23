/**
 * Checks and cleans the provided email.
 *
 * @function checkAndCleanEmail
 * @param {string} email - The email to be checked and cleaned.
 * @throws {Error} Will throw an error if the email is not provided or if it's not a string.
 * @throws {Error} Will throw an error if the email format is invalid.
 * @returns {string|null} - Returns the cleaned email, with all characters in lowercase and extra spaces removed.
 */
const checkAndCleanEmail = (email: string): string => {
  const expression = /^[a-zA-Z0-9.!#$%&'*+-=?^_`{|}~]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,9})$|^[\w\s]+<\s*[a-zA-Z0-9.!#$%&'*+-=?^_`{|}~]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,9})\s*>$/;
  const trimmedEmail = email.trim();

  if (!expression.test(trimmedEmail)) {
    throw new Error(`Invalid email format: ${trimmedEmail}`);
  }

  return trimmedEmail;
};

/**
 * Function to clean email addresses.
 * This function takes an array of email addresses as input, removes any falsy values,
 * and applies the checkAndCleanEmail function to each email address.
 *
 * @param {string} emailsString - An array of email addresses.
 * @returns {Array} - Returns an array of cleaned email addresses.
 */
const cleanEmails = (emailsString: string | undefined): string[] => {
  if(emailsString) {
    const emails = emailsString.split(",");

    if (typeof emails !== 'undefined' && Array.isArray(emails)) {
      return emails
        .filter(Boolean)
        .map(email => checkAndCleanEmail(email));
    }
  }
  return [];
};

export { checkAndCleanEmail, cleanEmails };
