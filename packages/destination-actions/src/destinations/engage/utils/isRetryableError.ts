import { getErrorDetails } from './ResponseError'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRetryableError(error: any) {
  return isRetryableStatus(getErrorDetails(error).status)
}

export function isRetryableStatus(status?: number) {
  //https://github.com/segmentio/centrifuge/blob/v3/plugin/status.go#L32
  let result = true
  const statusGroup = status === undefined ? undefined : Math.floor(status / 100)
  switch (statusGroup) {
    case 2: // 2xx
    case 4: // 4xx
      result = false
      break
    default:
      // 3xx, 5xx, etc...
      result = true
  }
  switch (status) {
    case 408: // Request Timeout
    case 423: // Locked
    case 429: // Too Many Requests
      result = true
      break
    case 501: // Not Implemented
      result = false
      break
    // default:
    //   break;
  }
  return result
}
