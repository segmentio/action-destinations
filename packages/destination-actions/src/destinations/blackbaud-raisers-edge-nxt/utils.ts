export const isRequestErrorRetryable = (statusCode: number) => {
  return statusCode === 401 || statusCode === 429 || statusCode >= 500
}
