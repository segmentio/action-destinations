/* eslint-disable no-useless-escape */
import type { Settings } from './generated-types'

export const validateURL = (settings: Settings) => {
  if (settings.customURL) {
    const urlRegEx =
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
    const regExMatcher = new RegExp(urlRegEx)
    const isCustomURLValid = typeof settings.customURL === 'string' && regExMatcher.test(settings.customURL)

    if (!isCustomURLValid) {
      throw new Error(
        `The Custom URL: ${settings.customURL} is invalid. It probably lacks the HTTP/HTTPS protocol or has an incorrect format.`
      )
    }
  }
}
