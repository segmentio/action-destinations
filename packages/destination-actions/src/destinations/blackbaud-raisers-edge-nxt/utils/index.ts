export const dateStringToFuzzyDate = (dateString: string) => {
  const date = new Date(dateString)
  if (isNaN(date)) {
    // invalid date object
    return false
  } else {
    // valid date object
    // convert date to a "Fuzzy date"
    // https://developer.blackbaud.com/skyapi/renxt/constituent/entities#FuzzyDate
    return {
      d: date.getDate().toString(),
      m: (date.getMonth() + 1).toString(),
      y: date.getFullYear().toString()
    }
  }
}

export const isRequestErrorRetryable = (statusCode: number) => {
  return statusCode === 401 || statusCode === 429 || statusCode >= 500
}
